import { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup } from 'pdf-lib';
import { safeLoadPdf } from '../utils/pdf-loader';
import { RunContext } from '../types';

export interface FormFieldInfo {
  name: string;
  type: 'text' | 'checkbox' | 'dropdown' | 'radio' | 'unknown';
  value?: string | boolean;
}

export interface FillFormOptions {
  fieldValues: Record<string, string | boolean>;
  flatten?: boolean;
}

export async function detectFormFields(data: Uint8Array): Promise<FormFieldInfo[]> {
  const doc = await safeLoadPdf(data);
  const form = doc.getForm();
  const fields = form.getFields();

  return fields.map((f) => {
    const name = f.getName();
    let type: FormFieldInfo['type'] = 'unknown';
    let value: string | boolean | undefined;

    if (f instanceof PDFTextField) {
      type = 'text';
      value = f.getText();
    } else if (f instanceof PDFCheckBox) {
      type = 'checkbox';
      value = f.isChecked();
    } else if (f instanceof PDFDropdown) {
      type = 'dropdown';
      value = f.getSelected()[0];
    } else if (f instanceof PDFRadioGroup) {
      type = 'radio';
      value = f.getSelected();
    }

    return { name, type, value };
  });
}

export async function fillAndFlattenForm(
  data: Uint8Array,
  options: FillFormOptions,
  ctx?: RunContext
): Promise<{ data: Uint8Array; fieldsUpdated: number; isFlattened: boolean }> {
  const doc = await safeLoadPdf(data);
  const form = doc.getForm();
  let fieldsUpdated = 0;

  ctx?.onProgress?.(0.3, 'Populating form values...');
  for (const [fieldName, val] of Object.entries(options.fieldValues)) {
    try {
      const field = form.getField(fieldName);
      if (field instanceof PDFTextField && typeof val === 'string') {
        field.setText(val);
        fieldsUpdated++;
      } else if (field instanceof PDFCheckBox && typeof val === 'boolean') {
        if (val) field.check();
        else field.uncheck();
        fieldsUpdated++;
      } else if (field instanceof PDFDropdown && typeof val === 'string') {
        field.select(val);
        fieldsUpdated++;
      } else if (field instanceof PDFRadioGroup && typeof val === 'string') {
        field.select(val);
        fieldsUpdated++;
      }
    } catch {
      // Ignore unknown field names
    }
  }

  if (options.flatten) {
    ctx?.onProgress?.(0.7, 'Flattening form fields into document pages...');
    form.flatten();
  }

  ctx?.onProgress?.(0.95, 'Saving finalized form...');
  const resultBytes = await doc.save();
  ctx?.onProgress?.(1.0, 'Done');

  return {
    data: resultBytes,
    fieldsUpdated,
    isFlattened: !!options.flatten,
  };
}
