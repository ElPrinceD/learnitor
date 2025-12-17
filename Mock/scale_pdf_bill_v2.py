#!/usr/bin/env python3
"""
PDF Bill Scaler - Improved Version
Uses a more thorough approach to find and replace all monetary values
while preserving formatting as much as possible.
"""

import re
import sys
from pathlib import Path

try:
    import fitz  # PyMuPDF
except ImportError:
    print("Error: PyMuPDF is required. Install it with: pip install PyMuPDF")
    sys.exit(1)


def extract_all_amounts(doc):
    """Extract all USD amounts with full context."""
    all_amounts = []
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text()
        text_dict = page.get_text("dict")
        
        # Extract using simple text search
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
                        old_text = match.group(0)
                        
                        # Find this text in the PDF with its formatting
                        text_instances = page.search_for(old_text, flags=fitz.TEXT_DEHYPHENATE)
                        
                        if text_instances:
                            for inst in text_instances:
                                # Get text at this location to extract formatting
                                # Expand the rectangle slightly to get surrounding text
                                expanded_rect = fitz.Rect(inst.x0 - 5, inst.y0 - 5, inst.x1 + 5, inst.y1 + 5)
                                words = page.get_text("words", clip=expanded_rect)
                                blocks = page.get_text("dict", clip=expanded_rect)
                                
                                font_size = 11
                                font_name = "helv"
                                color = 0
                                
                                # Extract formatting from blocks
                                for block in blocks.get("blocks", []):
                                    if "lines" in block:
                                        for line in block["lines"]:
                                            for span in line["spans"]:
                                                if old_text.upper() in span.get("text", "").upper():
                                                    font_size = span.get("size", 11)
                                                    font_name = span.get("font", "helv")
                                                    color = span.get("color", 0)
                                                    break
                                
                                all_amounts.append({
                                    'value': amount,
                                    'old_text': old_text,
                                    'format_template': format_template,
                                    'page': page_num,
                                    'rect': inst,
                                    'font_size': font_size,
                                    'font_name': font_name,
                                    'color': color
                                })
                except ValueError:
                    continue
    
    # Remove duplicates based on position
    seen = set()
    unique_amounts = []
    for amt in all_amounts:
        key = (amt['page'], amt['rect'].x0, amt['rect'].y0, amt['old_text'])
        if key not in seen:
            seen.add(key)
            unique_amounts.append(amt)
    
    return unique_amounts


def scale_pdf_bill(input_path, output_path, target_total=1448.97):
    """Scale PDF monetary values."""
    doc = fitz.open(input_path)
    
    print("Extracting monetary values...")
    all_amounts = extract_all_amounts(doc)
    
    if not all_amounts:
        print("Error: No USD amounts found.")
        doc.close()
        return False
    
    original_total = sum(a['value'] for a in all_amounts)
    print(f"\nFound {len(all_amounts)} unique monetary values")
    print(f"Original total: ${original_total:.2f}")
    
    if original_total == 0:
        print("Error: Total is zero.")
        doc.close()
        return False
    
    scaling_factor = target_total / original_total
    print(f"Scaling factor: {scaling_factor:.6f}")
    print(f"Target total: ${target_total:.2f}\n")
    
    # Create replacements
    print("Creating replacements...")
    replacements = []
    for amt in all_amounts:
        new_value = round(amt['value'] * scaling_factor, 2)
        new_text = amt['format_template'].format(f"{new_value:.2f}")
        replacements.append({
            'page': amt['page'],
            'old_text': amt['old_text'],
            'new_text': new_text,
            'rect': amt['rect'],
            'font_size': amt['font_size'],
            'font_name': amt['font_name'],
            'color': amt['color']
        })
        print(f"  Page {amt['page'] + 1}: {amt['old_text']} -> {new_text}")
    
    # Apply replacements
    print("\nApplying replacements...")
    replaced_count = 0
    
    for repl in replacements:
        page = doc[repl['page']]
        
        # Find text instances
        text_instances = page.search_for(repl['old_text'], flags=fitz.TEXT_DEHYPHENATE)
        
        if not text_instances:
            # Try case-insensitive
            text_instances = page.search_for(repl['old_text'], flags=fitz.TEXT_DEHYPHENATE | re.IGNORECASE)
        
        for inst in text_instances:
            # Check if this matches our expected rectangle
            if abs(inst.x0 - repl['rect'].x0) < 5 and abs(inst.y0 - repl['rect'].y0) < 5:
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
                    replaced_count += 1
                except Exception as e:
                    print(f"Warning: Could not replace on page {repl['page'] + 1}: {e}")
                break
    
    print(f"Replaced {replaced_count} out of {len(replacements)} values")
    
    # Save
    print(f"\nSaving to: {output_path}")
    doc.save(output_path, garbage=4, deflate=True)
    doc.close()
    
    # Verify
    print("\nVerifying...")
    verify_doc = fitz.open(output_path)
    verify_amounts = extract_all_amounts(verify_doc)
    new_total = sum(a['value'] for a in verify_amounts)
    
    print(f"Found {len(verify_amounts)} values in output")
    print(f"New total: ${new_total:.2f}")
    print(f"Target: ${target_total:.2f}")
    print(f"Difference: ${abs(new_total - target_total):.2f}")
    
    verify_doc.close()
    
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

