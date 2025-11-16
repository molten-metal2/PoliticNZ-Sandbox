DISPLAY_NAME_MIN_LENGTH = 2
DISPLAY_NAME_MAX_LENGTH = 20
BIO_MAX_LENGTH = 500
VALID_POLITICAL_ALIGNMENTS = ['National', 'Labour', 'Independent', '']

POST_CONTENT_MAX_LENGTH = 280
COMMENT_CONTENT_MAX_LENGTH = 200


def validate_display_name(display_name):
    if not display_name or not display_name.strip():
        return (False, 'display_name is required')
    
    name = display_name.strip()
    
    if len(name) < DISPLAY_NAME_MIN_LENGTH:
        return (False, f'display_name must be at least {DISPLAY_NAME_MIN_LENGTH} characters')
    
    if len(name) > DISPLAY_NAME_MAX_LENGTH:
        return (False, f'display_name must not exceed {DISPLAY_NAME_MAX_LENGTH} characters')
    
    return (True, None)


def validate_bio(bio):
    if bio is None:
        return (True, None)
    
    if len(bio) > BIO_MAX_LENGTH:
        return (False, f'bio must not exceed {BIO_MAX_LENGTH} characters')
    
    return (True, None)


def validate_political_alignment(alignment):
    if alignment is None:
        return (True, None)
    
    if alignment not in VALID_POLITICAL_ALIGNMENTS:
        valid_options = [a for a in VALID_POLITICAL_ALIGNMENTS if a]  # Exclude empty string
        options_str = ', '.join(valid_options)
        return (False, f'political_alignment must be {options_str}')
    
    return (True, None)


def validate_post_content(content):
    if not content or not content.strip():
        return (False, 'Content is required')
    
    if len(content) > POST_CONTENT_MAX_LENGTH:
        return (False, f'Content must not exceed {POST_CONTENT_MAX_LENGTH} characters')
    
    return (True, None)


def validate_comment_content(content):
    if not content or not content.strip():
        return (False, 'Comment content is required')
    
    if len(content) > COMMENT_CONTENT_MAX_LENGTH:
        return (False, f'Comment must not exceed {COMMENT_CONTENT_MAX_LENGTH} characters')
    
    return (True, None)


def validate_profile_private(profile_private):
    if profile_private is None:
        return (True, None)
    
    if not isinstance(profile_private, bool):
        return (False, 'profile_private must be a boolean value')
    
    return (True, None)


def validate_profile_data(display_name, bio=None, political_alignment=None, profile_private=None, for_update=False):
    if for_update and not display_name:
        pass  # Skip display_name validation if empty during update
    else:
        is_valid, error = validate_display_name(display_name)
        if not is_valid:
            return (is_valid, error)
    
    is_valid, error = validate_bio(bio)
    if not is_valid:
        return (is_valid, error)
    
    is_valid, error = validate_political_alignment(political_alignment)
    if not is_valid:
        return (is_valid, error)
    
    is_valid, error = validate_profile_private(profile_private)
    if not is_valid:
        return (is_valid, error)
    
    return (True, None)

