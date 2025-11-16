/**
 * Validation utilities for PoliticNZ frontend
 * Provides reusable validation functions matching backend validation
 */

// Validation constants (must match backend)
const DISPLAY_NAME_MIN_LENGTH = 2;
const DISPLAY_NAME_MAX_LENGTH = 20;
const BIO_MAX_LENGTH = 500;
const POST_CONTENT_MAX_LENGTH = 280;
const COMMENT_CONTENT_MAX_LENGTH = 200;
const VALID_POLITICAL_ALIGNMENTS = ['National', 'Labour', 'Independent', ''];

function validateDisplayName(displayName) {
  if (!displayName || !displayName.trim()) {
    return { isValid: false, error: 'Display name is required' };
  }

  const name = displayName.trim();

  if (name.length < DISPLAY_NAME_MIN_LENGTH) {
    return { isValid: false, error: `Display name must be at least ${DISPLAY_NAME_MIN_LENGTH} characters` };
  }

  if (name.length > DISPLAY_NAME_MAX_LENGTH) {
    return { isValid: false, error: `Display name must not exceed ${DISPLAY_NAME_MAX_LENGTH} characters` };
  }

  return { isValid: true, error: null };
}

function validateBio(bio) {
  if (!bio) {
    return { isValid: true, error: null };
  }

  if (bio.length > BIO_MAX_LENGTH) {
    return { isValid: false, error: `Bio must not exceed ${BIO_MAX_LENGTH} characters` };
  }

  return { isValid: true, error: null };
}

function validatePoliticalAlignment(alignment) {
  if (!alignment) {
    return { isValid: true, error: null };
  }

  if (!VALID_POLITICAL_ALIGNMENTS.includes(alignment)) {
    const validOptions = VALID_POLITICAL_ALIGNMENTS.filter(a => a); // Exclude empty string
    return { isValid: false, error: `Political alignment must be ${validOptions.join(', ')}` };
  }

  return { isValid: true, error: null };
}

function validatePostContent(content) {
  if (!content || !content.trim()) {
    return { isValid: false, error: 'Content is required' };
  }

  if (content.length > POST_CONTENT_MAX_LENGTH) {
    return { isValid: false, error: `Content must not exceed ${POST_CONTENT_MAX_LENGTH} characters` };
  }

  return { isValid: true, error: null };
}

function validateCommentContent(content) {
  if (!content || !content.trim()) {
    return { isValid: false, error: 'Comment content is required' };
  }

  if (content.length > COMMENT_CONTENT_MAX_LENGTH) {
    return { isValid: false, error: `Comment must not exceed ${COMMENT_CONTENT_MAX_LENGTH} characters` };
  }

  return { isValid: true, error: null };
}

function validateProfileData(displayName, bio, politicalAlignment) {
  let result = validateDisplayName(displayName);
  if (!result.isValid) {
    return result;
  }

  result = validateBio(bio);
  if (!result.isValid) {
    return result;
  }

  result = validatePoliticalAlignment(politicalAlignment);
  if (!result.isValid) {
    return result;
  }

  return { isValid: true, error: null };
}

function getValidationConstants() {
  return {
    DISPLAY_NAME_MIN_LENGTH,
    DISPLAY_NAME_MAX_LENGTH,
    BIO_MAX_LENGTH,
    POST_CONTENT_MAX_LENGTH,
    COMMENT_CONTENT_MAX_LENGTH,
    VALID_POLITICAL_ALIGNMENTS: VALID_POLITICAL_ALIGNMENTS.filter(a => a)
  };
}

