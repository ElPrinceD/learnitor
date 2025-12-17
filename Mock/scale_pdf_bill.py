#!/usr/bin/env python3
"""
PDF Bill Scaler - Preserves Exact Formatting
Scales all monetary values in a PDF proportionally to reach a target total.
Uses precise text replacement that maintains exact layout, fonts, and styling.
"""

import re
import sys
from pathlib import Path
from collections import defaultdict

try:
    import fitz  # PyMuPDF
except ImportError:
    print("Error: PyMuPDF is required. Install it with: pip install PyMuPDF")
    sys.exit(1)


def extract_all_amounts_with_positions(doc):
    """Extract all USD amounts with their exact positions and formatting."""
    all_amounts = []
    patterns = [
        (r'USD\s+([\d,]+\.?\d*)', 'USD {}'),
        (r'USD([\d,]+\.?\d*)', 'USD{}'),
        (r'\$([\d,]+\.?\d*)', '${}'),
        (r'([\d,]+\.\d{2})\s+USD', '{} USD'),
        (r'([\d,]+\.\d{2})USD', '{}USD'),
    ]
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        text_dict = page.get_text("dict")
        
        for block in text_dict.get("blocks", []):
            if "lines" not in block:
                continue
                
            for line in block["lines"]:
                for span in line["spans"]:
                    span_text = span.get("text", "")
                    if not span_text:
                        continue
                    
                    # Try each pattern
                    for pattern, format_template in patterns:
                        for match in re.finditer(pattern, span_text, re.IGNORECASE):
                            amount_str = match.group(1).replace(',', '')
                            try:
                                amount = float(amount_str)
                                if amount > 0:
                                    # Get bbox for this span
                                    bbox = span.get("bbox", [])
                                    all_amounts.append({
                                        'value': amount,
                                        'original_text': match.group(0),
                                        'format_template': format_template,
                                        'page': page_num,
                                        'span': span,
                                        'span_text': span_text,
                                        'match_start': match.start(),
                                        'match_end': match.end(),
                                        'bbox': bbox,
                                        'font_size': span.get("size", 11),
                                        'font_name': span.get("font", "helv"),
                                        'color': span.get("color", 0),
                                        'flags': span.get("flags", 0)
                                    })
                            except ValueError:
                                continue
    
    return all_amounts


def scale_pdf_bill(input_path, output_path, target_total=1448.97):
    """
    Scale all monetary values while preserving exact formatting.
    """
    doc = fitz.open(input_path)
    
    print("Extracting monetary values from PDF...")
    all_amounts = extract_all_amounts_with_positions(doc)
    
    if not all_amounts:
        print("Error: No USD amounts found in the PDF.")
        doc.close()
        return False
    
    # Calculate totals and scaling
    original_total = sum(a['value'] for a in all_amounts)
    print(f"\nFound {len(all_amounts)} monetary values")
    print(f"Original total: ${original_total:.2f}")
    
    if original_total == 0:
        print("Error: Total is zero. Cannot scale.")
        doc.close()
        return False
    
    scaling_factor = target_total / original_total
    print(f"Scaling factor: {scaling_factor:.6f}")
    print(f"Target total: ${target_total:.2f}\n")
    
    # Group replacements by page and span to avoid duplicates
    replacements_by_page_span = defaultdict(lambda: defaultdict(list))
    seen = set()
    
    for amount_info in all_amounts:
        old_value = amount_info['value']
        new_value = round(old_value * scaling_factor, 2)
        page_num = amount_info['page']
        span_id = id(amount_info['span'])
        match_key = (page_num, span_id, amount_info['match_start'], amount_info['match_end'])
        
        if match_key in seen:
            continue
        seen.add(match_key)
        
        format_template = amount_info['format_template']
        new_text = format_template.format(f"{new_value:.2f}")
        
        replacements_by_page_span[page_num][span_id].append({
            'old_text': amount_info['original_text'],
            'new_text': new_text,
            'span_text': amount_info['span_text'],
            'match_start': amount_info['match_start'],
            'match_end': amount_info['match_end'],
            'span': amount_info['span'],
            'bbox': amount_info['bbox'],
            'font_size': amount_info['font_size'],
            'font_name': amount_info['font_name'],
            'color': amount_info['color'],
            'flags': amount_info['flags']
        })
        
        print(f"  Page {page_num + 1}: {amount_info['original_text']} -> {new_text}")
    
    # Replace text with exact formatting preservation
    print("\nReplacing text with exact formatting preservation...")
    
    for page_num, spans_dict in replacements_by_page_span.items():
        page = doc[page_num]
        
        # Process each span
        for span_id, replacements in spans_dict.items():
            # Sort replacements by position (reverse for safe replacement)
            replacements.sort(key=lambda x: x['match_start'], reverse=True)
            
            # Get the first replacement to access span info
            first_repl = replacements[0]
            original_span_text = first_repl['span_text']
            
            # Build new text by replacing from end to start
            new_span_text = original_span_text
            for repl in replacements:
                start = repl['match_start']
                end = repl['match_end']
                new_span_text = new_span_text[:start] + repl['new_text'] + new_span_text[end:]
            
            # Find the text on the page
            bbox = fitz.Rect(first_repl['bbox'])
            if not bbox.is_valid:
                continue
            
            # Search for the original text
            text_instances = page.search_for(original_span_text, flags=fitz.TEXT_DEHYPHENATE)
            
            # Also try searching for just the amount part
            if not text_instances:
                for repl in replacements:
                    text_instances = page.search_for(repl['old_text'], flags=fitz.TEXT_DEHYPHENATE)
                    if text_instances:
                        # If we found by amount, we need to replace just that part
                        new_span_text = repl['new_text']
                        break
            
            for inst in text_instances:
                # Check if this instance is in the right area
                if bbox.is_valid and not inst.intersects(bbox):
                    continue
                
                # Convert color
                color_int = first_repl['color']
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
                
                # Insert with exact formatting
                try:
                    # Calculate baseline position
                    baseline_y = inst.y1
                    
                    page.insert_text(
                        fitz.Point(inst.x0, baseline_y),
                        new_span_text,
                        fontsize=first_repl['font_size'],
                        fontname=first_repl['font_name'],
                        color=color,
                        render_mode=first_repl['flags'] & 3  # Text rendering mode
                    )
                except Exception as e:
                    # Fallback
                    try:
                        page.insert_text(
                            fitz.Point(inst.x0, inst.y1),
                            new_span_text,
                            fontsize=first_repl['font_size'],
                            color=color
                        )
                    except Exception as e2:
                        print(f"Warning: Could not replace on page {page_num + 1}: {e2}")
                
                break  # Only replace first matching instance
    
    # Save
    print(f"\nSaving scaled PDF to: {output_path}")
    doc.save(output_path, garbage=4, deflate=True)
    doc.close()
    
    # Verify
    print("\nVerifying new PDF...")
    verify_doc = fitz.open(output_path)
    verify_amounts = extract_all_amounts_with_positions(verify_doc)
    new_total = sum(a['value'] for a in verify_amounts)
    
    print(f"Found {len(verify_amounts)} monetary values in output PDF")
    print(f"New total: ${new_total:.2f}")
    print(f"Target total: ${target_total:.2f}")
    print(f"Difference: ${abs(new_total - target_total):.2f}")
    
    verify_doc.close()
    
    if abs(new_total - target_total) < 0.01:
        print("\n✅ Success! PDF scaled correctly with exact formatting preserved.")
        return True
    else:
        print("\n⚠️  Warning: New total doesn't match target exactly.")
        return True


def main():
    """Main function."""
    downloads_folder = Path.home() / "Downloads"
    input_file = downloads_folder / "Bills _ Billing and Cost Management _ Global 2.pdf"
    output_file = downloads_folder / "Bills _ Billing and Cost Management _ Global 2_scaled.pdf"
    
    if not input_file.exists():
        print(f"Error: Input file not found: {input_file}")
        sys.exit(1)
    
    print(f"Input file: {input_file}")
    print(f"Output file: {output_file}\n")
    
    success = scale_pdf_bill(str(input_file), str(output_file), target_total=1448.97)
    
    if success:
        print(f"\n✅ Done! Scaled PDF saved to: {output_file}")
    else:
        print("\n❌ Failed to scale PDF.")
        sys.exit(1)


if __name__ == "__main__":
    main()
