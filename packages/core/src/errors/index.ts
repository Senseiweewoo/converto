export abstract class ConvertoError extends Error {
  abstract readonly code: string;
  abstract readonly actionableSuggestion: string;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class PasswordRequiredError extends ConvertoError {
  readonly code = 'PASSWORD_REQUIRED';
  readonly actionableSuggestion = 'Enter the document password to unlock and process this PDF.';

  constructor(message = 'This PDF is password protected.') {
    super(message);
  }
}

export class InvalidPasswordError extends ConvertoError {
  readonly code = 'INVALID_PASSWORD';
  readonly actionableSuggestion = 'The password entered is incorrect. Please check and try again.';

  constructor(message = 'Incorrect password provided for encrypted PDF.') {
    super(message);
  }
}

export class CorruptPdfError extends ConvertoError {
  readonly code = 'CORRUPT_PDF';
  readonly actionableSuggestion = 'The file appears incomplete or damaged. Try running the PDF Repair tool or re-exporting the original document.';

  constructor(message = 'Unable to parse PDF data. The file header or cross-reference table is corrupted.') {
    super(message);
  }
}

export class InvalidFileTypeError extends ConvertoError {
  readonly code = 'INVALID_FILE_TYPE';
  readonly actionableSuggestion = 'Please select a supported file type (e.g. PDF, JPG, PNG).';

  constructor(expected: string[], received: string) {
    super(`Unsupported file format "${received}". Expected: ${expected.join(', ')}.`);
  }
}

export class MemoryLimitExceededError extends ConvertoError {
  readonly code = 'MEMORY_LIMIT_EXCEEDED';
  readonly actionableSuggestion = 'The document is too large for browser memory. Try splitting it into smaller page ranges first.';

  constructor(sizeBytes: number) {
    const mb = (sizeBytes / (1024 * 1024)).toFixed(1);
    super(`Document size (${mb} MB) exceeds safe in-browser processing limit.`);
  }
}

export class EmptyFileError extends ConvertoError {
  readonly code = 'EMPTY_FILE';
  readonly actionableSuggestion = 'The selected file has 0 bytes. Please select a valid document.';

  constructor(filename = 'Selected file') {
    super(`${filename} is completely empty.`);
  }
}

export class UnsupportedFeatureError extends ConvertoError {
  readonly code = 'UNSUPPORTED_FEATURE';
  readonly actionableSuggestion = 'This PDF feature (e.g., proprietary dynamic XFA or 3D annotations) is not supported locally.';

  constructor(feature: string) {
    super(`Encountered unsupported feature: ${feature}.`);
  }
}
