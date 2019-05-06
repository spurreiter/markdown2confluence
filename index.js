const marked = require('marked')
const _ = require('min-util')
const qs = require('min-qs')

module.exports = exports = markdown2confluence

// https://roundcorner.atlassian.net/secure/WikiRendererHelpAction.jspa?section=all
// https://confluence.atlassian.com/display/DOC/Confluence+Wiki+Markup
// http://blogs.atlassian.com/2011/11/why-we-removed-wiki-markup-editor-in-confluence-4/

const MAX_CODE_LINE = 20

function Renderer () {}

const args = process.argv.slice(2)
const linenumbers = !!~['--linenumbers'].indexOf(args)

const rawRenderer = marked.Renderer

const langArr = 'actionscript3 bash csharp coldfusion cpp css delphi diff erlang groovy java javafx javascript perl php none powershell python ruby scala sql vb html/xml'.split(/\s+/)
const langMap = {
  shell: 'bash',
  html: 'html',
  xml: 'xml',
  js: 'javascript'
}
langArr.forEach(lang => { langMap[lang] = lang })

/*
function unescape (html) {
  // explicitly match decimal, hex, and named HTML entities
  return html.replace(/&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig, function (_, n) {
    n = n.toLowerCase()
    if (n === 'colon') return ':'
    if (n.charAt(0) === '#') {
      return n.charAt(1) === 'x'
        ? String.fromCharCode(parseInt(n.substring(2), 16))
        : String.fromCharCode(+n.substring(1))
    }
    return ''
  })
}
*/

Object.assign(Renderer.prototype, rawRenderer.prototype, {
  paragraph: function (text) {
    return text + '\n\n'
  },
  html: function (html) {
    return html
  },
  heading: function (text, level, raw) {
    return 'h' + level + '. ' + text + '\n\n'
  },
  strong: function (text) {
    return '*' + text + '*'
  },
  em: function (text) {
    return '_' + text + '_'
  },
  del: function (text) {
    return '-' + text + '-'
  },
  codespan: function (text) {
    return '{{' + text + '}}'
  },
  blockquote: function (quote) {
    return '{quote}' + quote + '{quote}'
  },
  br: function () {
    return '\n'
  },
  hr: function () {
    return '----'
  },
  link: function (href, title, text) {
    const arr = [href]
    if (text) {
      arr.unshift(text)
    }
    return '[' + arr.join('|') + ']'
  },
  list: function (body, ordered) {
    const arr = _.filter(_.trim(body).split('\n'), function (line) {
      return line
    })
    const type = ordered ? '#' : '*'
    const out = arr.map(line => {
      return type + ' ' + line
    }).join('\n').replace(/^([#*]) ([#*]+) /gm, '$1$2 ') + '\n\n'
    return out
  },
  listitem: function (body, ordered) {
    // console.log('#1 %j', body, ordered)
    return body + '\n'
  },
  image: function (href, title, text) {
    return '!' + href + '!'
  },
  table: function (header, body) {
    return header + body + '\n'
  },
  tablerow: function (content, flags) {
    return content + '\n'
  },
  tablecell: function (content, flags) {
    const type = flags.header ? '||' : '|'
    return type + content
  },
  code: function (code, lang) {
    // {code:language=java|borderStyle=solid|theme=RDark|linenumbers=true|collapse=true}
    if (lang) {
      lang = lang.toLowerCase()
    }
    lang = langMap[lang] || 'none'
    let param = {
      language: lang,
      // borderStyle: 'solid',
      theme: 'Confluence',
      // DJango
      // Emacs
      // FadeToGrey
      // Midnight
      // RDark
      // Eclipse
      // Confluence
      // linenumbers: linenumbers,
      // collapse: false
    }
    const lineCount = _.split(code, '\n').length
    if (lineCount > MAX_CODE_LINE) {
      // code is too long
      param.collapse = true
    }
    param = qs.stringify(param, '|', '=')
    return '{code:' + param + '}\n' + code + '\n{code}\n\n'
  }
})

const renderer = new Renderer()

function markdown2confluence (markdown) {
  return marked(markdown, {
    smartLists: true,
    renderer: renderer
  })
}
