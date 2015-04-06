/**
 * Based in https://github.com/sublimeye/jshint-jenkins-checkstyle-reporter
 * @type {exports}
 */
var fs = require('fs'),
  pairs = {
    "&": "&amp;",
    '"': "&quot;",
    "'": "&apos;",
    "<": "&lt;",
    ">": "&gt;"
  },
  severityCodes = {
    'e': 'error',
    'w': 'warning',
    'i': 'info'
  };

function encode (s) {
  for (var r in pairs) {
    if (typeof(s) !== 'undefined') {
      s = s.replace(new RegExp(r, "g"), pairs[r]);
    }
  }
  return s || '';
}

function getSeverity (code) {
  return severityCodes[ code.charAt(0).toLowerCase() ] || '';
}

function makeAttribute(attr, valueObject) {
  if (!valueObject[attr]) {
    throw Error('No property '+attr+' in error object');
  }

  return ' ' + attr + '="'+valueObject[attr]+'"';
}

exports.reportGJSLint = function(err, result, options) {
  var out = [],
    files = {};
  out.push('<?xml version=\"1.0\" encoding=\"utf-8\"?>');
  out.push('<checkstyle version=\"4.3\">');

  err.forEach(function(result) {
    // Register the file
    result.file = result.file.replace(/^\.\//, '');
    if (!files[result.file]) {
      files[result.file] = [];
    }

    // Add the error
    files[result.file].push({
      line: result.error.line,
      column: result.error.character,
      severity: getSeverity(result.error.code),
      message: encode(result.error.reason),
      source: 'jshint.' + result.error.code
    });
  });

  if (err && err.code === 2) {
    err.info.fails.forEach(function(fail) {
      var filename = fail.file,
        line = makeAttribute('line', fail),
        column = makeAttribute('column', fail),
        severity = makeAttribute('severity', fail),
        message = makeAttribute('message', fail),
        source = makeAttribute('source', fail);
      out.push('\t<file name=\"' + filename + '\">');
      fail.errors.forEach(
        function() {
          out.push('\t\t<error' + line + column + severity + message + source + ' />');
        });
      out.push('\t</file>');
    });
  }

  out.push('</checkstyle>', '\n');

  out = out.join('\n');

  if (options.dest) {
    fs.writeFileSync(options.dest, out, 'utf-8', function(err) {
      if (err) {
        console.log(err);
      } else {
        console.info('File written in ' + options.dest);
      }
    });
  } else {
    process.stdout.write(out);
  }
};

out.push("</checkstyle>");

process.stdout.write(out.join("\n") + "\n");