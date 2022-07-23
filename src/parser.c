#define WASM_EXPORT(name) __attribute__((export_name(name)))

extern unsigned char __heap_base;

// Uncomment to debug 👇🏼
//__attribute__((import_module("env"), import_name("printf"))) int printf(const char*, ...);

typedef unsigned int uintptr_t;

uintptr_t bump_pointer = 0;
void* malloc(unsigned long n) {
  unsigned int r = bump_pointer;
  bump_pointer += n;
  return (void *)r;
}

static unsigned int round_up_by_divisor(unsigned int num, unsigned int div) {
  return num + ((div - (num % div)) % div);
}

uintptr_t data_pointer;
uintptr_t tag_pointer;

#define true 1
#define false 0
#define read_char_at(idx) *((char*)(data_pointer + idx))
#define read_char() *((char*)(data_pointer + parser_state->index))

#define RESET_MODE 0
#define RULE_START_MODE 1
#define RULE_RESET_MODE 2
#define PROP_START_MODE 3
#define VALUE_RESET_MODE 4
#define VALUE_START_MODE 5
#define VALUE_END_MODE 6
#define CALL_RESET_MODE 7
#define CALL_START_MODE 8
#define VALUE_STRING_MODE 9
#define COMMENT_MODE 10
#define ERROR_MODE 11

#define TAG_EOF 0
#define TAG_RULE_START 1
#define TAG_PROPERTY 2
#define TAG_RULE_END 3
#define TAG_ERROR 4

#define VALUE_TYPE_INSERTION 1
#define VALUE_TYPE_STRING 2
#define VALUE_TYPE_IDENTIFIER 3
#define VALUE_TYPE_CALL 4
#define VALUE_TYPE_ARRAY 5
#define VALUE_TYPE_BOOLEAN 6
#define VALUE_TYPE_LABEL 7
#define VALUE_TYPE_KEYWORD 8

#define KEYWORD_UNSET 1
#define KEYWORD_INITIAL 2
#define KEYWORD_RESET_SHEET 3
#define KEYWORD_ALL 4

#define TOKEN_NOTCONSUMED 0
#define TOKEN_CONSUMED 1
#define TOKEN_EXIT 2

#define INS_HASH 193495087
#define TRUE_HASH 2090770405
#define FALSE_HASH 258723568
#define UNSET_HASH 276986740
#define INITIAL_HASH -1633193425
#define REVERT_SHEET_HASH 479564643
#define ALL_HASH 193486302

typedef struct parser_state_t {
  unsigned char mode;
  unsigned char last_mode;
  int index;
  int last_non_whitespace;
  int hole_index;
  int open_parens;
  int closed_parens;
  void* tag;
} parser_state_t;

struct parser_state_t *parser_state;

typedef struct tag_rule_start_t {
  unsigned char type;
  int selector_start;
  int selector_end;
} tag_rule_start_t;

typedef struct selector_list_t {
  int start;
  int end;
  struct selector_list_t* next;
} selector_list_t;

typedef struct value_type_node_t {
  char type;
  struct value_type_node_t* next;
  struct value_type_node_t* prev;
} value_type_node_t;

typedef struct value_type_string_t {
  value_type_node_t type;
  int start;
  int end;
} value_type_string_t;

typedef struct value_type_identifier_t {
  value_type_node_t type;
  int start;
  int end;
} value_type_identifier_t;

typedef struct value_type_call_t {
  value_type_node_t type;
  int name_start;
  int name_end;
  int num_of_args;
  value_type_node_t* first_arg;
  value_type_node_t* last_arg;
  struct value_type_call_t* parent;
} value_type_call_t;

typedef struct value_type_ins_t {
  value_type_node_t type;
  int index;
} value_type_ins_t;

typedef struct value_type_arr_t {
  value_type_node_t type;
} value_type_arr_t;

typedef struct value_type_bool_t {
  value_type_node_t type;
  char value;
} value_type_bool_t;

typedef struct value_type_keyword_t {
  value_type_node_t type;
  unsigned char keyword;
} value_type_keyword_t;

typedef struct tag_prop_t {
  unsigned char type;
  int prop_start;
  int prop_end;
  int num_of_values;
  value_type_node_t* first_value;
  value_type_node_t* last_value;
} tag_prop_t;

#ifdef DEBUG_BUILD
typedef struct tag_error_t {
  unsigned char type;
  int code;
  int data;
} tag_error_t;
#endif


WASM_EXPORT("hash") long hash(int start, int end) {
  int idx = start;
  char c;
  long hash = 5381;
  while(idx < end) {
    c = read_char_at(idx);
    hash = ((hash << 5) + hash) + c;
    idx++;
  }
  return hash;
}

static char identifierToken(char c) {
  // Capital letters
  if((c >= 65 && c <= 90) ||
    // Lower-case letters
    (c >= 97 && c <= 122)) {
    return true;
  } else {
    return false;
  }
}

static char numberToken(char c) {
  return c >= 48 && c <= 57;
}

static char selectorToken(char c) {
  if(identifierToken(c) || numberToken(c)) return true;
  switch(c) {
    case '#':
    case '.':
    case '[':
    case ']':
    case '(':
    case ')':
    case ':':
    case '-':
    case '>':
    case '+':
    case '~': {
      return true;
    }
    default: return false;
  }
}

static char whitespaceToken(char c) {
  return c == ' '
    || (c >= 10 && c <= 13); // tabs, newlines, etc.
}

static char callArgToken(char c) { 
  return selectorToken(c) || c == '"' || c == '-';
}

static void free_tag() {
  // Loop over tag and zero out
  int len = bump_pointer - tag_pointer;
  int* s = (int*)tag_pointer;
  for(; len; len--, s++) *s = 0;

  bump_pointer = tag_pointer;
}

#ifdef DEBUG_BUILD
static int create_error_tag(int code, int data) {
  free_tag();
  tag_error_t* err = malloc(sizeof(*err));
  err->type = TAG_ERROR;
  err->code = code;
  err->data = data;
  parser_state->tag = err;
  return TOKEN_EXIT;
}
#endif

static inline tag_prop_t* get_prop_tag() {
  tag_prop_t* prop = (tag_prop_t*)parser_state->tag;
  return prop;
}

static inline char in_value_node() {
  return parser_state->open_parens > parser_state->closed_parens;
}

static inline char post_value_mode() {
  return in_value_node() ? CALL_START_MODE : VALUE_RESET_MODE;
}

static value_type_node_t* get_current_value() {
  tag_prop_t* prop = get_prop_tag();
  value_type_node_t* last_value = prop->last_value;
  if(!in_value_node()) {
    return last_value;
  }
  value_type_call_t* value_call = (value_type_call_t*)last_value;
  return value_call->last_arg;
}

static inline void append_value_to_node(value_type_node_t* previous_sibling_node, value_type_node_t* new_value_node) {
  previous_sibling_node->next = new_value_node;
  new_value_node->prev = previous_sibling_node;
}

static void append_value_to_tree(value_type_node_t* value_node) {
  tag_prop_t* prop = get_prop_tag();
  if(prop->first_value == 0) {
    prop->first_value = value_node;
    prop->last_value = value_node;
    prop->num_of_values++;
  } else if(in_value_node()) {
    value_type_call_t* last_call = (value_type_call_t*)prop->last_value;
    if(last_call->first_arg == 0) {
      last_call->first_arg = value_node;
      last_call->last_arg = value_node;
    } else {
      append_value_to_node(last_call->last_arg, value_node);
      last_call->last_arg = value_node;
    }
    last_call->num_of_args++;
    // Only if this is a call itself, give it the parent and make it the last value
    if(value_node->type == VALUE_TYPE_CALL) { // NEVER HAPPENS
      ((value_type_call_t*)value_node)->parent = last_call;
      prop->last_value = value_node;
    }
  } else {
    append_value_to_node(prop->last_value, value_node);
    prop->last_value = value_node;
    prop->num_of_values++;
  }
}

static void replace_node(value_type_node_t* ref, value_type_node_t* new_last) {
  tag_prop_t* prop = get_prop_tag();

  // If this is not the first argument, just replace pointers
  if(ref->prev != 0) {
    value_type_node_t* prev = ref->prev;

    prev->next = new_last;
    new_last->prev = prev;

    if(new_last->type == VALUE_TYPE_CALL && prop->last_value->type == VALUE_TYPE_CALL) {
      value_type_call_t* parent_call = (value_type_call_t*)prop->last_value;
      parent_call->last_arg = new_last;
      ((value_type_call_t*)new_last)->parent = parent_call;
    }

    if(ref == prop->last_value || new_last->type == VALUE_TYPE_CALL) {
      prop->last_value = new_last;
    }
  } else {
    if(in_value_node()) {
      value_type_call_t* last_call = 0;
      if(ref->type == VALUE_TYPE_CALL) {
        last_call = ((value_type_call_t*)ref)->parent;
      } else {
        last_call = (value_type_call_t*)prop->last_value;
      }
      if(new_last->type == VALUE_TYPE_CALL) {
        ((value_type_call_t*)new_last)->parent = last_call;
        prop->last_value = new_last;
      }
      last_call->first_arg = new_last;
      last_call->last_arg = new_last;
    } else {
      prop->first_value = new_last;
      prop->last_value = new_last;
    }
  }
}

static unsigned char check_for_comment(char c) {
  if(c == '/' && read_char_at(parser_state->index + 1) == '*') {
    parser_state->last_mode = parser_state->mode;
    parser_state->mode = COMMENT_MODE;
    return 1;
  }
  return 0;
}

static unsigned char parse_reset_mode() {
  char c = read_char();
  if(selectorToken(c)) {
    parser_state->last_non_whitespace = parser_state->index;
    parser_state->mode = RULE_START_MODE;
    free_tag();
    tag_rule_start_t *rule_start = malloc(sizeof(tag_rule_start_t));
    rule_start->type = TAG_RULE_START;
    rule_start->selector_start = parser_state->index;
    parser_state->tag = rule_start;
  } else {
    check_for_comment(c);
  }
  return TOKEN_CONSUMED;
}

static unsigned char parse_rule_start_mode() {
  char c = read_char();
  if(selectorToken(c)) {
    parser_state->last_non_whitespace = parser_state->index;
  } else {
    if(c != ' ') { // Space
      if(c == '{') { // {
        parser_state->mode = RULE_RESET_MODE;
        tag_rule_start_t *rule_start = (tag_rule_start_t*)parser_state->tag;
        rule_start->selector_end = parser_state->last_non_whitespace + 1;
        return TOKEN_EXIT;
      } else {
        check_for_comment(c);
        // error?
      }
    }
  }
  return TOKEN_CONSUMED;
}

static unsigned char parse_rule_reset_mode() {
  char c = read_char();
  if(identifierToken(c) || c == '-') {
    free_tag();
    tag_prop_t *prop = malloc(sizeof(tag_prop_t));
    prop->type = TAG_PROPERTY;
    prop->prop_start = parser_state->index;
    prop->prop_end = 0;
    prop->num_of_values = 0;
    prop->first_value = 0;
    prop->last_value = 0;

    parser_state->tag = prop;
    parser_state->mode = PROP_START_MODE;
  } else if(c == '}') {
    parser_state->mode = RESET_MODE;
  } else {
    check_for_comment(c);
    // ERROR
  }
  return TOKEN_CONSUMED;
}

static unsigned char parse_prop_start_mode() {
  char c = read_char();
  tag_prop_t* prop = get_prop_tag();
  if(identifierToken(c)) {
    parser_state->last_non_whitespace = parser_state->index;
  } else if(c == ':') {
    if(prop->prop_end == 0)
      prop->prop_end = parser_state->last_non_whitespace + 1;
    parser_state->mode = VALUE_RESET_MODE;
  } else {
    check_for_comment(c);
    // ERROR
  }
  return TOKEN_CONSUMED;
}

static unsigned char parse_value_reset_mode() {
  char c = read_char();
  if(selectorToken(c) || c == '-' /* I think - is redundant */) {
    value_type_identifier_t* value_id = malloc(sizeof(*value_id));
    value_type_node_t* node = (value_type_node_t*)value_id;
    node->type = c == '[' ? VALUE_TYPE_LABEL : VALUE_TYPE_IDENTIFIER;
    node->next = 0;
    node->prev = 0;
    value_id->start = parser_state->index;

    append_value_to_tree(node);
    parser_state->mode = VALUE_START_MODE;
  } else if(c == '"') {
    value_type_string_t* value_string = malloc(sizeof(value_type_string_t));
    value_type_node_t* node = (value_type_node_t*)value_string;
    node->type = VALUE_TYPE_STRING;
    node->next = 0;
    node->prev = 0;
    value_string->start = parser_state->index + 1;
    parser_state->mode = VALUE_STRING_MODE;
    append_value_to_tree(node);
    return TOKEN_CONSUMED;
  } else if(c == ';') {
    parser_state->mode = RULE_RESET_MODE;
    return TOKEN_EXIT;
  } else if(c == ',') {
    value_type_arr_t* value_arr = malloc(sizeof(value_type_arr_t));
    value_type_node_t* node = (value_type_node_t*)value_arr;
    node->type = VALUE_TYPE_ARRAY;
    append_value_to_tree(node);
  } else if(!whitespaceToken(c) && !check_for_comment(c)) {
    #ifdef DEBUG_BUILD
    return create_error_tag(2, c);
    #endif
  }

  return TOKEN_CONSUMED;
}

static void parse_value_end() {
  value_type_node_t* value_node = get_current_value();
  switch(value_node->type) {
    case VALUE_TYPE_INSERTION: {
      break;
    }
    case VALUE_TYPE_STRING: {
      value_type_string_t* value_str = (value_type_string_t*)value_node;
      value_str->end = parser_state->index;
      break;
    }
    case VALUE_TYPE_IDENTIFIER:
    case VALUE_TYPE_LABEL: {
      value_type_identifier_t* value_id = (value_type_identifier_t*)value_node;
      value_id->end = parser_state->index;

      if(value_node->type == VALUE_TYPE_IDENTIFIER) {
        long h = hash(value_id->start, value_id->end);

        switch(h) {
          case TRUE_HASH:
          case FALSE_HASH: {
            value_type_bool_t* value_bool = malloc(sizeof(value_type_bool_t));
            value_type_node_t* value_bool_node = (value_type_node_t*)value_bool;
            value_bool_node->type = VALUE_TYPE_BOOLEAN;
            value_bool_node->prev = 0;
            value_bool_node->next = 0;
            value_bool->value = h == TRUE_HASH ? 1 : 0;

            replace_node(value_node, value_bool_node);
            break;
          }
          case REVERT_SHEET_HASH:
          case ALL_HASH:
          case INITIAL_HASH:
          case UNSET_HASH: {
            value_type_keyword_t* value_kw = malloc(sizeof(value_type_keyword_t));
            value_type_node_t* value_kw_node = (value_type_node_t*)value_kw;
            value_kw_node->type = VALUE_TYPE_KEYWORD;
            value_kw_node->prev = 0;
            value_kw_node->next = 0;
            int kw = 0;
            switch(h) {
              case REVERT_SHEET_HASH: kw = KEYWORD_RESET_SHEET; break;
              case ALL_HASH: kw = KEYWORD_ALL; break;
              case INITIAL_HASH: kw = KEYWORD_INITIAL; break;
              case UNSET_HASH: kw = KEYWORD_UNSET; break;
            }
            value_kw->keyword = kw;

            replace_node(value_node, value_kw_node);
            break;
          }
        }
      }

      break;
    }
  }
}

static unsigned char parse_value_start_mode() {
  char c = read_char();

  if(c == ';') {
    // End of property
    parse_value_end();
    parser_state->mode = RULE_RESET_MODE;
    return TOKEN_EXIT;
  } else if(c == '(') {
    parser_state->mode = CALL_RESET_MODE;
    return TOKEN_NOTCONSUMED;
  } else if((c == ',' || c == ')') && in_value_node()) {
    parse_value_end();
    parser_state->mode = CALL_START_MODE;
    if(c == ')') {
      return TOKEN_NOTCONSUMED;
    }
  } else if(whitespaceToken(c)) {
    // This is a multi
    if(get_prop_tag()->last_value != 0) {
      parse_value_end();
    }
    parser_state->mode = post_value_mode();
  } else if(c == ',') {
    if(get_prop_tag()->last_value != 0) {
      parse_value_end();
    }

    parser_state->mode = post_value_mode();
    value_type_arr_t* value_arr = malloc(sizeof(value_type_arr_t));
    value_type_node_t* node = (value_type_node_t*)value_arr;
    node->type = VALUE_TYPE_ARRAY;
    append_value_to_tree(node);
  } else if(!selectorToken(c) && c != '-') {
    if(!check_for_comment(c)) {
      #ifdef DEBUG_BUILD
      return create_error_tag(1, c);
      #endif
    }
  }

  return TOKEN_CONSUMED;
}

static unsigned char parse_string_mode() {
  char c = read_char();
  if(c == '"') {
    // Ignore if escaped.
    if(parser_state->index > 0 && read_char_at(parser_state->index-1) != '\\') {
      parse_value_end();
      parser_state->mode = post_value_mode();
    }
  }
  return TOKEN_CONSUMED;
}

static unsigned char parse_comment_mode() {
  char c = read_char();
  if(c == '/' && read_char_at(parser_state->index - 1) == '*') {
    parser_state->mode = parser_state->last_mode;
    parser_state->last_mode = COMMENT_MODE;
  }
  return TOKEN_CONSUMED;
}

static unsigned char parse_call_reset_mode() {
  char c = read_char();

  if(c == '(') {
    value_type_node_t* value_id_node = get_current_value();
    value_type_identifier_t* value_id = (value_type_identifier_t*)value_id_node;

    // Create a call node
    value_type_call_t* value_call = malloc(sizeof(value_type_call_t));
    value_type_node_t* value_call_node = (value_type_node_t*)value_call;
    value_call_node->next = 0;
    value_call_node->prev = 0;
    value_call->name_start = value_id->start;
    value_call->name_end = parser_state->index;
    value_call->num_of_args = 0;
    value_call->first_arg = 0;
    value_call->last_arg = 0;
    value_call->parent = 0;
    
    value_call_node->type = VALUE_TYPE_CALL;
    replace_node(value_id_node, value_call_node);

    parser_state->mode = CALL_START_MODE;
    parser_state->open_parens++;
  } else if(callArgToken(c)) {
    parser_state->mode = VALUE_RESET_MODE;
    return TOKEN_NOTCONSUMED;
  } else {
    check_for_comment(c);
  }
  return TOKEN_CONSUMED;
}

static unsigned char parse_call_start_mode() {
  char c = read_char();

  if(c == ')') {
    // Close out if inside another call, properly
    value_type_node_t* value_call_node = get_prop_tag()->last_value;
    value_type_call_t* value_call = (value_type_call_t*)value_call_node;
    parser_state->closed_parens++;

    long h = hash(value_call->name_start, value_call->name_end);
    if(h == INS_HASH) {
      value_type_ins_t* value_ins = malloc(sizeof(value_type_ins_t));
      value_type_node_t* value_ins_node = (value_type_node_t*)value_ins;
      value_ins_node->type = VALUE_TYPE_INSERTION;
      value_ins_node->prev = 0;
      value_ins_node->next = 0;
      value_ins->index = parser_state->hole_index++;
      replace_node(value_call_node, value_ins_node);

      parser_state->mode = VALUE_START_MODE;
    } else {
      parser_state->mode = VALUE_START_MODE;
    }

    // If nested, promote the parent to be the new last tag.
    if(value_call->parent != 0) {
      get_prop_tag()->last_value = (value_type_node_t*)value_call->parent;
    }
  } else if(callArgToken(c)) {
    parser_state->mode = VALUE_RESET_MODE;
    return TOKEN_NOTCONSUMED;
  } else {
    check_for_comment(c);
  }
  
  return TOKEN_CONSUMED;
}

WASM_EXPORT("reset") uintptr_t reset(unsigned int msize) {
  uintptr_t base_pointer = (uintptr_t)&__heap_base;
  // TODO create and use a memset
  if(bump_pointer > 0) {
    unsigned long len = bump_pointer - base_pointer;
    int *s = (int*)base_pointer;
    for(; len; len--, s++) *s = 0;
  }

  bump_pointer = base_pointer;
  unsigned int data_size = round_up_by_divisor(msize, 4);
  data_pointer = (uintptr_t)malloc(data_size);

  parser_state = malloc(sizeof(parser_state_t));
  parser_state->index = 0;
  parser_state->mode = RESET_MODE;
  parser_state->last_mode = 0;
  parser_state->hole_index = 0;
  parser_state->last_non_whitespace = 0;
  parser_state->open_parens = 0;
  parser_state->closed_parens = 0;
  parser_state->tag = 0;

  // This sets the start of where tags should be created.
  tag_pointer = bump_pointer;

  return data_pointer;
}

WASM_EXPORT("get_tag") uintptr_t get_tag() {
  return tag_pointer;
}

static int parse_next_token() {
  switch(parser_state->mode) {
    case RESET_MODE: return parse_reset_mode();
    case RULE_START_MODE: return parse_rule_start_mode();
    case RULE_RESET_MODE: return parse_rule_reset_mode();
    case PROP_START_MODE: return parse_prop_start_mode();
    case VALUE_RESET_MODE: return parse_value_reset_mode();
    case VALUE_START_MODE: return parse_value_start_mode();
    case CALL_RESET_MODE: return parse_call_reset_mode();
    case CALL_START_MODE: return parse_call_start_mode();
    case VALUE_STRING_MODE: return parse_string_mode();
    case COMMENT_MODE: return parse_comment_mode();
    default: return 0;
  }
  return TOKEN_CONSUMED;
}

WASM_EXPORT("parse") int parse(int array_len) {
  while(parser_state->index < array_len) {
    switch(parse_next_token()) {
      case TOKEN_CONSUMED: {
        parser_state->index++;
        break;
      }
      case TOKEN_NOTCONSUMED: {
        break;
      }
      case TOKEN_EXIT: {
        goto exit;
      }
    }
  }

  return false;

  exit: {
    return true;
  }
}