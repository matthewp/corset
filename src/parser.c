#define export __attribute__((visibility("default")))

extern unsigned char __heap_base;

// Uncomment to debug 👇🏼
//__attribute__((import_module("env"), import_name("printf"))) int printf(const char*, ...);

unsigned int bump_pointer;
void* malloc(unsigned long n) {
  unsigned int r = bump_pointer;
  bump_pointer += n;
  return (void *)r;
}

unsigned int tag_pointer;

#define true 1
#define false 0
#define read_char_at(idx) *((char*)idx)
#define read_char() *((char*)parser_state->index)

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
#define ERROR_MODE 10

#define TAG_EOF 0
#define TAG_RULE_START 1
#define TAG_PROPERTY 2
#define TAG_RULE_END 3
#define TAG_ERROR 4

#define VALUE_TYPE_INSERTION 1
#define VALUE_TYPE_STRING 2
#define VALUE_TYPE_IDENTIFIER 3
#define VALUE_TYPE_CALL 4

#define TOKEN_NOTCONSUMED 0
#define TOKEN_CONSUMED 1
#define TOKEN_EXIT 2

#define INS_HASH 193495087

typedef struct parser_state_t {
  unsigned char mode;
  int index;
  int last_non_whitespace;
  int hole_index;
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
  int nameStart;
  int nameEnd;
  int argStart;
  int argEnd;
} value_type_call_t;

typedef struct value_type_ins_t {
  value_type_node_t type;
  int index;
} value_type_ins_t;

typedef struct tag_prop_t {
  unsigned char type;
  int prop_start;
  int prop_end;
  int num_of_values;
  value_type_node_t* first_value;
  value_type_node_t* last_value;
} tag_prop_t;

// TODO remove
typedef struct tag_error_t {
  unsigned char type;
  int code;
  int data;
} tag_error_t;

static long hash(int start, int end) {
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
  if(c >= 97 && c <= 122) {
    return true;
  } else {
    return false;
  }
}

static char selectorToken(char c) {
  if(identifierToken(c)
    || c == '#' // #
    || c == '.' // .
  ) {
    return true;
  } else {
    return false;
  }
}

static char whitespaceToken(char c) {
  return c == ' '
    || (c >= 10 && c <= 13); // tabs, newlines, etc.
}

static void free_tag() {
  // Loop over tag and zero out
  int len = bump_pointer - tag_pointer;
  int* s = (int*)tag_pointer;
  for(; len; len--, s++) *s = 0;

  bump_pointer = tag_pointer;
}

static tag_prop_t* get_prop_tag() {
  tag_prop_t* prop = (tag_prop_t*)parser_state->tag;
  return prop;
}

static void add_value_to_prop(value_type_node_t* value_node) {
  tag_prop_t* prop = get_prop_tag();
  if(prop->first_value == 0) {
    prop->first_value = value_node;
    prop->last_value = value_node;
  } else {
    value_type_node_t* last_node = prop->last_value;
    last_node->next = value_node;
    value_node->prev = last_node;
    prop->last_value = value_node;
  }
  prop->num_of_values++;
}

static void replace_node(value_type_node_t* ref, value_type_node_t* new_last) {
  tag_prop_t* prop = get_prop_tag();
  if(ref->prev == 0) {
    prop->first_value = new_last;
    prop->last_value = new_last;
  } else {
    value_type_node_t* prev = ref->prev;
    prev->next = new_last;
    new_last->prev = prev;
    if(ref == prop->last_value) {
      prop->last_value = new_last;
    }
  }
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
    // ERROR
  }
  return TOKEN_CONSUMED;
}

static unsigned char parse_prop_start_mode() {
  char c = read_char();
  if(selectorToken(c)) {
    parser_state->last_non_whitespace = parser_state->index;
  } else if(c == ':') {
    tag_prop_t* prop = get_prop_tag();
    prop->prop_end = parser_state->last_non_whitespace + 1;
    parser_state->mode = VALUE_RESET_MODE;
  } else {
    // ERROR
  }
  return TOKEN_CONSUMED;
}

static unsigned char parse_value_reset_mode() {
  char c = read_char();
  if(identifierToken(c)) {
    value_type_identifier_t* value_id = malloc(sizeof(*value_id));
    value_type_node_t* node = (value_type_node_t*)value_id;
    node->type = VALUE_TYPE_IDENTIFIER;
    node->next = 0;
    node->prev = 0;
    value_id->start = parser_state->index;

    add_value_to_prop(node);
    parser_state->mode = VALUE_START_MODE;
  } else if(c == '"') {
    value_type_string_t* value_string = malloc(sizeof(value_type_string_t));
    value_type_node_t* node = (value_type_node_t*)value_string;
    node->type = VALUE_TYPE_STRING;
    node->next = 0;
    node->prev = 0;
    value_string->start = parser_state->index + 1;
    parser_state->mode = VALUE_STRING_MODE;
    add_value_to_prop(node);
    return TOKEN_CONSUMED;
  } else if(c == ';') {
    parser_state->mode = RULE_RESET_MODE;
    return TOKEN_EXIT;
  } else if(!whitespaceToken(c)) {
    // ERROR
    free_tag();
    tag_error_t* err = malloc(sizeof(*err));
    err->type = TAG_ERROR;
    err->code = 2;
    err->data = c;
    parser_state->tag = err;
    return TOKEN_EXIT;
  }
  return TOKEN_CONSUMED;
}

static void parse_value_end() {
  tag_prop_t* prop = (tag_prop_t*)parser_state->tag;
  switch(prop->last_value->type) {
    case VALUE_TYPE_INSERTION: {
      break;
    }
    case VALUE_TYPE_STRING: {
      value_type_string_t* value_str = (value_type_string_t*)prop->last_value;
      value_str->end = parser_state->index;
      break;
    }
    case VALUE_TYPE_IDENTIFIER: {
      value_type_identifier_t* value_id = (value_type_identifier_t*)prop->last_value;
      value_id->end = parser_state->index;
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
    tag_prop_t* prop = get_prop_tag();
    value_type_identifier_t* value_id = (value_type_identifier_t*)prop->last_value;
    value_type_node_t* value_id_node = (value_type_node_t*)value_id;

    // Create a call node
    value_type_call_t* value_call = malloc(sizeof(value_type_call_t));
    value_type_node_t* value_call_node = (value_type_node_t*)value_call;
    value_call_node->next = 0;
    value_call_node->prev = 0;
    value_call->nameStart = value_id->start;
    value_call->nameEnd = parser_state->index;

    value_call->argStart = parser_state->index + 1;
    value_call->argEnd = 0;
    
    value_call_node->type = VALUE_TYPE_CALL;
    replace_node(value_id_node, value_call_node);

    parser_state->mode = CALL_RESET_MODE;
  } else if(whitespaceToken(c)) {
    // This is a multi
    if(get_prop_tag()->last_value != 0) {
      parse_value_end();
    }
    parser_state->mode = VALUE_RESET_MODE;
  } else if(!identifierToken(c)) {
    parser_state->mode = ERROR_MODE;
    free_tag();
    tag_error_t* err = malloc(sizeof(*err));
    err->type = TAG_ERROR;
    err->code = 1;
    parser_state->tag = err;
    return TOKEN_EXIT;
  }

  return TOKEN_CONSUMED;
}

static unsigned char parse_string_mode() {
  char c = read_char();
  if(c == '"') {
    parse_value_end();
    parser_state->mode = VALUE_RESET_MODE;
  }
  return TOKEN_CONSUMED;
}

static unsigned char parse_call_reset_mode() {
  char c = read_char();
  if(c == ')') {
    tag_prop_t* prop = get_prop_tag();
    value_type_call_t* value_call = (value_type_call_t*)prop->last_value;
    value_type_node_t* value_call_node = (value_type_node_t*)value_call;
    long h = hash(value_call->nameStart, value_call->nameEnd);
    if(h == INS_HASH) {
      value_type_ins_t* value_ins = malloc(sizeof(value_type_ins_t));
      value_type_node_t* value_ins_node = (value_type_node_t*)value_ins;
      value_ins_node->type = VALUE_TYPE_INSERTION;
      value_ins_node->prev = 0;
      value_ins_node->next = 0;
      value_ins->index = parser_state->hole_index++;
      
      tag_prop_t* prop = get_prop_tag();
      replace_node(value_call_node, value_ins_node);

      parser_state->mode = VALUE_START_MODE;
    } else {
      value_type_call_t* value_call = (value_type_call_t*)prop->last_value;
      value_call->argEnd = parser_state->index;
      parser_state->mode = VALUE_START_MODE;
    }
  }
  return TOKEN_CONSUMED;
}

export void reset() {
  bump_pointer = (unsigned int)&__heap_base; // free()
  parser_state = malloc(sizeof(parser_state_t));
  parser_state->index = 0;
  parser_state->mode = RESET_MODE;
  parser_state->hole_index = 0;
  parser_state->tag = 0;

  // This sets the start of where tags should be created.
  tag_pointer = bump_pointer;
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
    case VALUE_STRING_MODE: return parse_string_mode();
  }
  return TOKEN_CONSUMED;
}

export int parse(int array_len) {
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

export void* result() {
  return parser_state->tag;
}