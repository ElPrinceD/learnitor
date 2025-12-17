#!/usr/bin/env python3
"""
PDF Bill Scaler - Final Version
Finds and replaces all monetary values while preserving formatting as much as possible.
"""

import re
import sys
from pathlib import Path

try:
    import fitz  # PyMuPDF
except ImportError:
    print("Error: PyMuPDF is required. Install it with: pip install PyMuPDF")
    sys.exit(1)


def extract_amounts_from_text(text):
    """Extract all USD amounts from text."""
    amounts = []
    patterns = [
        (r'USD\s+([\d,]+\.?\d*)', 'USD {}'),
        (r'USD([\d,]+\.?\d*)', 'USD{}'),
        (r'\$([\d,]+\.?\d*)', '${}'),
        (r'([\d,]+\.\d{2})\s+USD', '{} USD'),
        (r'([\d,]+\.\d{2})USD', '{}USD'),
    ]
    
    for pattern, format_template in patterns:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            amount_str = match.group(1).replace(',', '')
            try:
                amount = float(amount_str)
                if amount > 0:
                    amounts.append({
                        'value': amount,
                        'text': match.group(0),
                        'format_template': format_template
                    })
            except ValueError:
                continue
    
    return amounts


def get_text_formatting(page, rect):
    """Get font formatting for text at a given rectangle."""
    # Expand rect slightly to get surrounding context
    expanded = fitz.Rect(rect.x0 - 10, rect.y0 - 5, rect.x1 + 10, rect.y1 + 5)
    blocks = page.get_text("dict", clip=expanded)
    
    font_size = 11
    font_name = "helv"
    color = 0
    
    for block in blocks.get("blocks", []):
        if "lines" in block:
            for line in block["lines"]:
                for span in line["spans"]:
                    span_bbox = fitz.Rect(span.get("bbox", []))
                    if span_bbox.intersects(rect):
                        font_size = span.get("size", 11)
                        font_name = span.get("font", "helv")
                        color = span.get("color", 0)
                        return font_size, font_name, color
    
    return font_size, font_name, color


def scale_pdf_bill(input_path, output_path, target_total=1448.97):
    """Scale PDF monetary values."""
    doc = fitz.open(input_path)
    
    # Extract all amounts
    print("Extracting monetary values...")
    all_amounts_info = []
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text()
        amounts = extract_amounts_from_text(text)
        
        for amt in amounts:
            # Find this text in the PDF
            text_instances = page.search_for(amt['text'], flags=fitz.TEXT_DEHYPHENATE)
            
            for inst in text_instances:
                font_size, font_name, color = get_text_formatting(page, inst)
                all_amounts_info.append({
                    'value': amt['value'],
                    'text': amt['text'],
                    'format_template': amt['format_template'],
                    'page': page_num,
                    'rect': inst,
                    'font_size': font_size,
                    'font_name': font_name,
                    'color': color
                })
    
    # Remove duplicates (same page, same position, same text)
    seen = set()
    unique_amounts = []
    for amt in all_amounts_info:
        key = (amt['page'], round(amt['rect'].x0, 1), round(amt['rect'].y0, 1), amt['text'])
        if key not in seen:
            seen.add(key)
            unique_amounts.append(amt)
    
    if not unique_amounts:
        print("Error: No amounts found.")
        doc.close()
        return False
    
    original_total = sum(a['value'] for a in unique_amounts)
    print(f"\nFound {len(unique_amounts)} unique monetary values")
    print(f"Original total: ${original_total:.2f}")
    
    if original_total == 0:
        print("Error: Total is zero.")
        doc.close()
        return False
    
    scaling_factor = target_total / original_total
    print(f"Scaling factor: {scaling_factor:.6f}")
    print(f"Target total: ${target_total:.2f}\n")
    
    # Create replacements
    print("Preparing replacements...")
    replacements = []
    for amt in unique_amounts:
        new_value = round(amt['value'] * scaling_factor, 2)
        new_text = amt['format_template'].format(f"{new_value:.2f}")
        replacements.append({
            'page': amt['page'],
            'old_text': amt['text'],
            'new_text': new_text,
            'rect': amt['rect'],
            'font_size': amt['font_size'],
            'font_name': amt['font_name'],
            'color': amt['color']
        })
        print(f"  Page {amt['page'] + 1}: {amt['text']} -> {new_text}")
    
    # Apply replacements
    print(f"\nApplying {len(replacements)} replacements...")
    replaced = 0
    
    for repl in replacements:
        page = doc[repl['page']]
        
        # Find text instances
        text_instances = page.search_for(repl['old_text'], flags=fitz.TEXT_DEHYPHENATE)
        
        if not text_instances:
            continue
        
        # Use the first instance that's close to our expected position
        for inst in text_instances:
            # Check if position matches (within 10 pixels)
            if (abs(inst.x0 - repl['rect'].x0) < 10 and 
                abs(inst.y0 - repl['rect'].y0) < 10):
                
                # Convert color
                color_int = repl['color']
                if color_int != 0:
                    r = ((color_int >> 16) & 0xFF) / 255.0
                    g = ((color_int >> 8) & 0xFF) / 255.0
                    b = (color_int & 0xFF) / 255.0
                    color = (r, g, b)
                else:
                    color = (0, 0, 0)
                
                # Redact and replace
                page.add_redact_annot(inst, fill=(1, 1, 1))
                page.apply_redactions()
                
                try:
                    page.insert_text(
                        fitz.Point(inst.x0, inst.y1),
                        repl['new_text'],
                        fontsize=repl['font_size'],
                        fontname=repl['font_name'],
                        color=color
                    )
                    replaced += 1
                except Exception as e:
                    # Fallback without font name
                    try:
                        page.insert_text(
                            fitz.Point(inst.x0, inst.y1),
                            repl['new_text'],
                            fontsize=repl['font_size'],
                            color=color
                        )
                        replaced += 1
                    except:
                        pass
                break
    
    print(f"Successfully replaced {replaced} values")
    
    # Save
    print(f"\nSaving to: {output_path}")
    doc.save(output_path, garbage=4, deflate=True)
    doc.close()
    
    # Verify
    print("\nVerifying...")
    verify_doc = fitz.open(output_path)
    verify_text = ""
    for page_num in range(len(verify_doc)):
        verify_text += verify_doc[page_num].get_text()
    
    verify_amounts = extract_amounts_from_text(verify_text)
    new_total = sum(a['value'] for a in verify_amounts)
    
    print(f"Found {len(verify_amounts)} values in output")
    print(f"New total: ${new_total:.2f}")
    print(f"Target: ${target_total:.2f}")
    print(f"Difference: ${abs(new_total - target_total):.2f}")
    
    verify_doc.close()
    
    if abs(new_total - target_total) < 1.0:
        print("\n✅ Success! Total is close to target.")
    else:
        print("\n⚠️  Warning: Total doesn't match target.")
    
    return True


def main():
    downloads_folder = Path.home() / "Downloads"
    input_file = downloads_folder / "Bills _ Billing and Cost Management _ Global 2.pdf"
    output_file = downloads_folder / "Bills _ Billing and Cost Management _ Global 2_scaled.pdf"
    
    if not input_file.exists():
        print(f"Error: Input file not found: {input_file}")
        sys.exit(1)
    
    print(f"Input: {input_file}")
    print(f"Output: {output_file}\n")
    
    success = scale_pdf_bill(str(input_file), str(output_file), target_total=1448.97)
    
    if success:
        print(f"\n✅ Done! Output: {output_file}")
    else:
        print("\n❌ Failed.")
        sys.exit(1)


if __name__ == "__main__":
    main()


