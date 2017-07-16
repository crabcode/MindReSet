/* lexical grammar */
%lex

%%
\s+            /* skip whitespace */
"and"          return "AND"
"or"           return "OR"
"not"          return "NOT"
[a-zA-Z0-9]+   return "TAG"
"("            return "("
")"            return ")"
<<EOF>>        return "EOF"
.              return "INVALID"

/lex

/* operator associations and precedence */

%left "OR"
%left "AND"
%right "NOT"

%start expressions

%% /* language grammar */

expressions
    : e EOF
        { return $1; }
    ;

e
    : e "OR" e
        { $$ = {type: "or", left: $1, right: $3}; }
    | e "AND" e
        { $$ = {type: "and", left: $1, right: $3}; }
    | "NOT" e
        {{
          $$ = $2;
          $$.not = !$$.not;
        }}
    | "(" e ")"
        { $$ = $2; }
    | compound-tag
        { $$ = {type: "tag", tag: $1}; }
    ;

compound-tag
    : compound-tag TAG
        { $$ = $1 + " " + $2; }
    | TAG
        { $$ = $1; }
    ;
