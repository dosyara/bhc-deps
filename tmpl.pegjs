{
}

Content
  = cont:(LineComment / CommentTag / d:DepsTag / Text)*
  {
    return cont.filter(i => i.type === 'Dependency')
  }

DepsTag
  = OpenBracket WhiteSpaceControlStart? WhiteSpace* name:DepsTagName WhiteSpace* LineTerminator* a:DepsTagContent WhiteSpace* LineTerminator* WhiteSpaceControlEnd? CloseBracket
  {
    return {
      type: 'Dependency',
      tagName: name,
      attributes: a
    }
  }

OpenBracket
  = "<"

CloseBracket
  = ">"

DepsTagName
  = "TMPL_INCLUDE"
  / "TMPL_REQUIRE"
  / "TMPL_INLINE"

DepsTagContent
  = (WhiteSpace* LineTerminator? attr:DepsTagAttributes LineComment? WhiteSpace* LineTerminator? { return attr; })+

DepsTagAttributes
  = SingleStaticAttribute / PairAttributeValue / SingleAttributeValue

SingleAttributeValue
  = n:$[a-zA-Z0-9\-_/:\.{}\$\'\"]+

PairAttributeValue
  = name:AttributeName "=" value:AttributeValue
  {
    return {
      name,
      value
    }
  }

AttributeName
  = n:$[a-zA-Z0-9\-_]+

AttributeValue
  = StringValue / PerlExpression / SimpleAttributeValue

SingleStaticAttribute
  = "IGNORE-DUPLICATES"
  { return ''; }

StringValue
  = StringQuote s:StringValueContent StringQuote
  {
    return s;
  }

StringQuote
  = '"' / "'"

StringValueContent
  = str:(!StringQuote .)*
  {
    return str.map(i => i[1]).join('');
  }

SimpleAttributeValue
  = n:$[a-zA-Z0-9\-_/:\.{}\$\[\]\%]+

PerlExpression
  = "[%" PerlExpressionContent "%]"

PerlExpressionContent
  = a:(!"%]" .)*
  {
    return a.map(i => i[1]).join('');
  }

WhiteSpaceControlStart "[whitespace control character]"
  = "-"
  / "~."
  / "~|"
  / "~"

WhiteSpaceControlEnd "[whitespace control character]"
  = "-"
  / ".~"
  / "|~"
  / "~"

Text
  = t:(!LineComment !CommentTag !DepsTag .)+
  {
    return false ? t.map(i => i[3]).join('') : '';
  }

LineComment "[line comment]"
  = WhiteSpace* "##" WhiteSpace* text:LineCommentText LineTerminator*
  {
    return {
      type: 'LineComment',
      content: text
    }
  }

LineCommentText
  = text:(!LineTerminator .)*
  {
    return false ? text.map(i => i[1]).join('') : '';
  }

CommentTag "[TMPL_COMMENT]"
  = WhiteSpace* CommentTagStart text:CommentTagBody CommentTagEnd LineTerminator*
  {
    return {
      type: 'CommentTag',
      content: text
    }
  }

CommentTagStart
  = "<TMPL_COMMENT>"

CommentTagBody
  = text:(!CommentTagEnd .)*
 {
   return false ? text.map(i => i[1]).join('') : '';
 }

CommentTagEnd
  = "</TMPL_COMMENT>"

LineTerminator "[end of line]"
  = "\n"
  / "\r\n"
  / "\r"
  / "\u2028"
  / "\u2029"

WhiteSpace "[whitespace]"
  = "\t"
  / "\v"
  / "\f"
  / " "
  / "\u00A0"
  / "\uFEFF"
  / [\u0020\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]

EOF "[end of file]"
  = !.