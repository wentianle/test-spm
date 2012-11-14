define('#backbone/0.9.2/backbone-debug', ['underscore', '$'], function(require, exports) {

  var previousUnderscore = this._;
  var previousJQuery = this.jQuery;
  this._ = require('underscore');
  this.jQuery = require('$');

<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd">
<!-- <!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN"
"http://www.w3.org/TR/html4/strict.dtd"> -->
<HTML>
<HEAD>
<META HTTP-EQUIV="Refresh" CONTENT="0.1">
<META HTTP-EQUIV="Pragma" CONTENT="no-cache">
<META HTTP-EQUIV="Expires" CONTENT="-1">
<TITLE></TITLE>
</HEAD>
<BODY><P></BODY>
</HTML>


  this._ = previousUnderscore;
  this.jQuery = previousJQuery;
});
