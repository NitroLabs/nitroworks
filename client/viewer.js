window.me = document.location.toString().match(/^file:/)?'web-offline':'web-online'; // me: {cli, web-offline, web-online}
var browser = 'unknown';
var showEditor = true;
var remoteUrl = './remote.pl?url=';
const EXAMPLES = '/examples/';

var gCurrentFile = null;
var gProcessor = null;
var gEditor = null;
var gCurrentFiles = [];       // linear array, contains files (to read)
window.gMemFs = [];              // associated array, contains file content in source gMemFs[i].{name,source}
var gMemFsCount = 0;          // async reading: count of already read files
var gMemFsTotal = 0;          // async reading: total files to read (Count==Total => all files read)
var gMemFsChanged = 0;        // how many files have changed
var gRootFs = [];             // root(s) of folders
window._includePath = './';



Template.editor.rendered = function () {
   // Load geditor and theme before executing other js
   AceEditor.instance("editor",{
       theme:"chrome",
       mode:"javascript"
   }, function(editor) {
      gEditor = editor;
      onload();
   });
};







if(navigator.userAgent.match(/(opera|chrome|safari|firefox|msie)/i))
   browser = RegExp.$1.toLowerCase();
$(document).ready(function() {
   $("#menu").height($(window).height());       // initial height
   $(window).resize(function() {                // adjust the relevant divs
      $("#menu").height($(window).height());
      $("#menuHandle").css({top: '45%'});
   });
   setTimeout( function(){$('#menu').css('left','-280px');},3000); // -- hide slide-menu after 3secs
   $('#menu').mouseleave(function() {
      $('#examples').css('height',0); $('#examples').hide();
      $('#options').css('height',0); $('#options').hide();
   });
   // -- Examples
   $('#examplesTitle').click(function() {
      $('#examples').css('height','auto');
      $('#examples').show();
      $('#options').css('height',0); $('#options').hide();
   });
   $('#examples').mouseleave(function() {
      $('#examples').css('height',0); $('#examples').hide();
   });
   // -- Options
   $('#optionsTitle').click(function() {
      $('#options').css('height','auto'); $('#options').show();
      $('#examples').css('height',0); $('#examples').hide();
   });
   $('#options').mouseleave(function() {
      $('#options').css('height',0); $('#options').hide();
   });
   getOptions();
   //$('#optionsForm').submit(function() {
   //   // save to cookie
   //   $('#optionsForm').hide();
   //   return false;
   //});
   $('#optionsForm').change(function() {
      // save to cookie
      saveOptions();
   });

   $('#plate').change(function() {
      if($('#plate').val()=='custom') {
         $('#customPlate').show();
      } else {
         $('#customPlate').hide();
      }
   });
});







var ex = [
{ file:'logo.jscad', title: 'OpenJSCAD.org Logo' },
{ file:'logo.amf', title: 'OpenJSCAD.org Logo', type: 'AMF' },
{ file:'example001.jscad', title: 'Sphere with cutouts', spacing: true },
{ file:'example001.scad', title: 'Sphere with cutouts', type: 'OpenSCAD' },
{ file:'example002.jscad', title: 'Cone with cutouts' },
{ file:'example002.scad', title: 'Cone with cutouts', type: 'OpenSCAD' },
{ file:'example003.jscad', title: 'Cube with cutouts' },
{ file:'example003.scad', title: 'Cube with cutouts', type: 'OpenSCAD' },
// { file:'example004.jscad', title: 'Cube minus sphere' },
{ file:'example005.jscad', title: 'Pavillon' },
// { file:'center.jscad', title: 'Centers of Primitives' },
// { file:'bunch-cubes.jscad', title: 'Bunch of Cubes', new: true },
{ file:'lookup.jscad', title: 'Lookup()', spacing: true },
{ file:'expand.jscad', title: 'Expand()' },
{ file:'rectangular_extrude.jscad', title: 'Rectangular_extrude()' },
{ file:'linear_extrude.jscad', title: 'Linear_extrude()' },
{ file:'rotate_extrude.jscad', title: 'Rotate_extrude()' },
{ file:'polyhedron.jscad', title: 'Polyhedron()' },
{ file:'hull.jscad', title: 'Hull()' },
{ file:'chain_hull.jscad', title: 'Chain_hull()' },
{ file:'torus.jscad', title: 'Torus()' },
{ file:'text.jscad', title: 'Vector_text()', spacing: true },
{ file:'transparency.jscad', title: 'Transparency', spacing: true },
{ file:'transparency.amf', title: 'Transparency', type: 'AMF' },
{ file:'transparency2.jscad', title: 'Transparency 2' },
{ file:'slices/double-screw.jscad', title: 'SolidFromSlices(): Double Screw', spacing: true },
{ file:'slices/four2three.jscad', title: 'SolidFromSlices(): 4 to 3' },
{ file:'slices/four2three-round.jscad', title: 'SolidFromSlices(): 4 to 3 round' },
{ file:'slices/spring.jscad', title: 'SolidFromSlices(): Spring' },
{ file:'slices/tor.jscad', title: 'SolidFromSlices(): Tor (multi-color)' },
{ file:'slices/rose.jscad', title: 'SolidFromSlices(): Rose Curve' },
{ file:'servo.jscad', title: 'Interactive Params: Servo Motor', wrap: true },
{ file:'gear.jscad', title: 'Interactive Params: Gear' },
{ file:'s-hook.jscad', title: 'Interactive Params: S Hook' },
{ file:'grille.jscad', title: 'Interactive Params: Grille' },
{ file:'axis-coupler.jscad', title: 'Interactive Params: Axis Coupler' },
{ file:'lamp-shade.jscad', title: 'Interactive Params: Lamp Shade' },
{ file:'celtic-knot-ring.jscad', title: 'Interactive Params: Celtic Knot Ring' },
{ file:'stepper-motor.jscad', title: 'Interactive Params: Stepper Motor' },
{ file:'iphone4-case.jscad', title: 'Interactive Params: iPhone4 Case' },
{ file:'name_plate.jscad', title: 'Interactive Params: Name Plate' },
{ file:'balloons.jscad', title: 'Interactive Params: Balloons', new: true },
{ file:'globe.jscad', title: 'Globe' },
{ file:'platonics/', title: 'Recursive Include(): Platonics', spacing: true },
{ file:'3d_sculpture-VernonBussler.stl', title: '3D Model: 3D Sculpture (Vernon Bussler)', type: 'STL', spacing: true },
{ file:'frog-OwenCollins.stl', title: '3D Model: Frog (Owen Collins)', type: 'STL' },
{ file:'thing_7-Zomboe.stl', title: '3D Model: Thing 7 / Flower (Zomboe)', type: 'STL' },
// { file:'organic_flower-Bogoboy23.stl', title: '3D Model: Organic Flower (Bogoboy23)', type: 'STL' }, // all wrong normals!!
{ file:'yoda-RichRap.stl', title: '3D Model: Yoda (RichRap)', type: 'STL' },
// { url:'http://pastebin.com/raw.php?i=wJLctyAQ', title: 'OpenJSCAD.org Logo', type:'Remote JSCAD' }
// { file:'treefrog-Jerrill.stl', title: '3D Model: Treefrog (Jerrill)', type: 'STL' },    // nice frog, yet slow
// { file:'klein_bottle-DizingOf.stl', title: '3D Model: Klein Bottle (DizingOf)', type: 'STL' } // too slow, over 400k triangles, huge memory consumption
];
if(me=='web-online') {
   var wrap = 26;
   var colp = 100/Math.floor(ex.length/wrap+1)+"%";
   var src = '<table width=100%><tr><td widthx="+colp+" valign=top>';
   //src += "<img id=examplesHandle src=\"imgs/menuHandleHU.png\">";
   //src += '<b>Examples:</b>';
   for(var i=0; i<ex.length; i++) {
      if(ex[i].wrap) {
         src += "</td><td class=examplesSeparator widthx="+colp+" valign=top>";
      }
      if(ex[i].spacing) src += "<p/>";
      src += "<li><a href='#' onclick='fetchExample(\"examples/"+ex[i].file+"\"); return false;'>"+ex[i].title+"</a>\n";
      if(ex[i].type) src += " <span class=type>("+ex[i].type+")</span></a>";
      if(ex[i].new) src += " <span class=newExample>new</span></a>";
      //src += "<li><a href='examples/"+ex[i].file+"\'>"+ex[i].title+"</a>\n";
   }
   src += "</td></tr></table>";
   $('#examples').html(src);
} else {
   // examples off-line won't work yet as XHR is used
   $('#examples').html("You are offline, drag'n'drop the examples from your installation");
}
{
   var options = [ 'renderCode', 'author', 'license' ];
   var metakeys = [ 'author', 'license' ];
   saveOptions = function() {
      for(var k in options) {
         k = options[k];
         //echo("setting "+k);
         setCookie(k,$('#'+k).val());
         if(metakeys[k]) metadata[k] = options[k];
      }
   }
   getOptions = function() {
      for(var k in options) {
         k = options[k];
         //echo("getting "+k);
         if(getCookie(k)) $('#'+k).val(getCookie(k))
      }
   }

   var src = '';
   src += "<form id=optionsForm onsubmit='saveOptions(); return false'>";
   src += "<div class=optionGroup><b>Your Identity / Full Name & Email</b><br/>";
   src += "<input id=author type=text name=author size=30><div class=optionInfo>Applies when you export AMF (sets metadata)</div></div>";
   var licenseOptions = {
      "Public Domain": "Public Domain",
      "CC BY": "Creative Commons CC BY",
      "CC BY-ND": "Creative Commons CC BY-ND",
      "CC BY-NC": "Creative Commons CC BY-NC",
      "CC BY-SA": "Creative Commons CC BY-SA",
      "CC BY-NC-SA": "Creative Commons CC BY-NC-SA",
      "CC BY-NC-ND": "Creative Commons CC BY-NC-ND",
      "MIT": "MIT License",
      "GPLv2": "GPLv2",
      "GPLv3": "GPLv3",
      "Copyright": "Copyright",
   };
   src += "<div class=optionGroup><b>Default License</b><br/>";
   src += "<select id=license name=license>";
   for(var k in licenseOptions) {
      src += "<option value='"+k+"'>"+licenseOptions[k];
      src += "<br/>";
   }
   src += "</select><div class=optionInfo>Applies when you export AMF (sets metadata)</div></div>\n";
   if(0) {
      var renderCodeOptions = {
         shiftReturn: "SHIFT+RETURN",
         auto: "Automatic"
      };
      src += "<div class=optionGroup><b>Render Code</b></br>";
      src += "<select id=renderCode name=renderCode>";
      for(var k in renderCodeOptions) {
         src += "<option value='"+k+"'>"+renderCodeOptions[k];
      }
      src += "</select></div>";
   }
   if(1) {
      var plateOptions = {
         "200x200": "200mm x 200mm",
         "150x150": "150mm x 150mm",
         "100x100": "100mm x 100mm",
         "custom": "Custom",
         "none": "None",
      };
      src += "<div class=optionGroup><b>Plate</b></br>";
      src += "<select id=plate name=plate>";
      for(var k in plateOptions) {
         src += "<option value='"+k+"'>"+plateOptions[k];
      }
      src += "</select><br/>";
      src += "<div style='display: none' id=customPlate>Custom: <input type=text id=plateCustomX name=plateCustomX size=4 value='125'> x <input type=text id=plateCustomY name=plateCustomY size=4 value='125'> [mm]</div>";
      src += "</div>";
   }
   if(1) {
      var themeOptions = {
         "bright": "Bright",
         "dark": "Dark",
      };
      src += "<div class=optionGroup><b>Theme</b></br>";
      src += "<select id=theme name=theme>";
      for(var k in themeOptions) {
         src += "<option value='"+k+"'>"+themeOptions[k];
      }
      src += "</select><br/>";
      src += "</div>";
   }
   src += "</form>";
   $('#options').html(src);
}









// WORKER. MOVE TO WORKER FILE
// adapted from http://www.html5rocks.com/en/tutorials/workers/basics/
/*
self.onmessage = function(e) {      // Worker to import STL/OBJ as it can take quite some while for 1MB+ large STLs
   var data = e.data; // JSON.parse(e.data);
   me = data.me;                    // required for openscad.js parse*()
   version = data.version;          //     ''               ''
   if(data.url) {     // RANT: why do something simple, when it can be done complicate: Workers & importScripts() (guys!!)
      var url = data.url;
      url = url.replace(/#.*$/,'');    // -- just to be sure ...
      url = url.replace(/\?.*$/,'');
      var index = url.indexOf('index.html');
      if(index!=-1) {
         url = url.substring(0,index);
      }
      importScripts(url+'csg.js',url+'openjscad.js',url+'openscad.js');
      var src, type;
      data.filename.toLowerCase().match(/\.(stl|obj|amf|gcode)$/i);
      type = RegExp.$1;
      if(type=='obj') {
         src = parseOBJ(data.source,data.filename);
      } else if(type=='amf') {
         src = parseAMF(data.source,data.filename);
      } else if(type=='gcode') {
         src = parseGCode(data.source,data.filename);
      } else {
         src = parseSTL(data.source,data.filename);
      }
      self.postMessage({ source: src, filename: data.filename, url: data.remote });
   }
};
*/





function onload() {
   gProcessor = new OpenJsCad.Processor(document.getElementById("viewerContext"));
   $('.ace_gutter').css({'background-color': 'transparent'});
   //gEditor.getSession().on('change', function(e) { ; });
   ['Shift-Return'].forEach(function(key) {
      gEditor.commands.addCommand({
         name: 'myCommand',
         bindKey: { win: key, mac: key },
         exec: function(editor) {
            var src = editor.getValue();
            if(src.match(/^\/\/\!OpenSCAD/i)) {
               //editor.getSession().setMode("ace/mode/scad");
               src = openscadOpenJscadParser.parse(src);
            } else {
               //editor.getSession().setMode("ace/mode/javascript");
            }
            gMemFs = [];
            gProcessor.setJsCad(src);
         },
      });
   });
   if(0) {     // for reload when drag'n'dropped file(s) ([Reload] equivalent)
      viewer.onkeypress = function(evt) {
         if(evt.shiftKey&&evt.keyCode=='13') {   // Shift + Return
            superviseFiles({forceReload:true});
         }
      };
   }

   setupDragDrop();
   //gProcessor.setDebugging(debugging);
   if(me=='web-online') {    // we are online, fetch first example
      //    gProcessor.setJsCad(gEditor.getValue());
      docUrl = document.URL;
      params = {};
      docTitle = '';
      if((!docUrl.match(/#(https?:\/\/\S+)$/)) && (!docUrl.match(/#(examples\/\S+)$/))) {
         if(possibleParams = docUrl.split("&")) {
            //console.log(possibleParams);
            for (i = 0; i < possibleParams.length; ++i) {
               //console.log("looping over: "+possibleParams[i]);
                if(match = possibleParams[i].match(/^.*#?param\[([^\]]+)\]=(.*)$/i)) {
                  //console.log("matched parameter: key="+decodeURIComponent(match[1])+", val="+decodeURIComponent(match[2])+"");
                  params[decodeURIComponent(match[1])] = decodeURIComponent(match[2]);
                }
                else if(match = possibleParams[i].match(/^.*#?showEditor=false$/i)) {
                  //console.log("not showing editor.");
                  showEditor = false;
                  $('#editor').hide();
                }
                else if(match = possibleParams[i].match(/^.*#?fetchUrl=(.*)$/i)) {
                  //console.log("matched fetchUrl="+match[1]);
                  urlParts = document.URL.match(/^([^#]+)#/);
                  // derive an old-style URL for compatibility's sake
                  docUrl = urlParts[1] + "#" + decodeURIComponent(match[1]);
                }
                else if(match = possibleParams[i].match(/^.*#?title=(.*)$/i)) {
                  //console.log("matched title="+decodeURIComponent(match[1]));
                  docTitle = decodeURIComponent(match[1]);
                }
            }
            //console.log(params,docUrl,docTitle);
         }
      }
      if(docUrl.match(/#(https?:\/\/\S+)$/)) {   // remote file referenced, e.g. http://openjscad.org/#http://somewhere/something.ext
         var u = RegExp.$1;
         var xhr = new XMLHttpRequest();
         echo("fetching",u);
         xhr.open("GET",remoteUrl+u,true);
         if(u.match(/\.(stl|gcode)$/i)) {
            xhr.overrideMimeType("text/plain; charset=x-user-defined");    // our pseudo binary retrieval (works with Chrome)
         }
         OpenJsCad.status("Fetching "+u+" <img id=busy src='imgs/busy.gif'>");
         xhr.onload = function() {
            //echo(this.responseText);
            var data = JSON.parse(this.responseText);
            //echo(data.url,data.filename,data.file);
            fetchExample(data.file,data.url);
            document.location = docUrl.replace(/#.*$/,'#');       // this won't reload the entire web-page
         }
         xhr.send();

      } else if(docUrl.match(/#(examples\/\S+)$/)) {    // local example, e.g. http://openjscad.org/#examples/example001.jscad
         var fn = RegExp.$1;
         fetchExample(fn);
         document.location = docUrl.replace(/#.*$/,'#');

      } else {
         fetchExample(EXAMPLES+ex[0].file);
      }
   } else {
      gProcessor.setJsCad(gEditor.getValue());
   }
}
function fetchExample(fn,url) {
   gMemFs = []; gCurrentFiles = [];

   if(showEditor) {
      $('#editor').show();
   } else {
      $('#editor').hide();
   }

   if(fn.match(/\.[^\/]+$/)) {     // -- has extension
      ;                                  // -- we could already check if valid extension (later)
   } else {                              // -- folder referenced
      if(!fn.match(/\/$/)) 
         fn += "/";      // add tailing /
      fn += 'main.jscad';
   }
   //echo("checking gMemFs");
   //if(gMemFs[fn]) {
   //   console.log("found locally:",gMemFs[i].name);
   //}
   if(1) {     // doesn't work off-line yet
      var xhr = new XMLHttpRequest();
      xhr.open("GET", fn, true);
      if(fn.match(/\.(stl|gcode)$/i)) {
         xhr.overrideMimeType("text/plain; charset=x-user-defined");    // our pseudo binary retrieval (works with Chrome)
      }
      OpenJsCad.status("Loading "+fn+" <img id=busy src='imgs/busy.gif'>");
      xhr.onload = function() {
         var source = this.responseText;
         var editorSource = source;
         var asyncComputation = false;
         var path = fn;
         _includePath = path.replace(/\/[^\/]+$/,'/');

         //gEditor.getSession().setMode("ace/mode/javascript");
         if(fn.match(/\.jscad$/i)||fn.match(/\.js$/i)) {
            OpenJsCad.status("Processing "+fn+" <img id=busy src='imgs/busy.gif'>");
            //if(url) editorSource = "// Remote retrieved <"+url+">\n"+editorSource;
            putSourceInEditor(editorSource,fn);
            gProcessor.setJsCad(source,fn);

         } else if(fn.match(/\.scad$/i)) {
            OpenJsCad.status("Converting "+fn+" <img id=busy src='imgs/busy.gif'>");
            editorSource = source;
            //if(url) editorSource = "// Remote retrieved <"+url+">\n"+editorSource;
            if(!editorSource.match(/^\/\/!OpenSCAD/i)) {
               editorSource = "//!OpenSCAD\n"+editorSource;
            }
            source = openscadOpenJscadParser.parse(editorSource);
            if(0) {
               source = "// OpenJSCAD.org: scad importer (openscad-openjscad-translator) '"+fn+"'\n\n"+source;
            }
            //gEditor.getSession().setMode("ace/mode/scad");
            putSourceInEditor(editorSource,fn);
            gProcessor.setJsCad(source,fn);

         } else if(fn.match(/\.(stl|obj|amf|gcode)$/i)) {
            OpenJsCad.status("Converting "+fn+" <img id=busy src='imgs/busy.gif'>");
            if(!fn.match(/\.amf/)) {
               // import STL/OBJ/AMF via Worker() (async computation) as it takes quite some time
               // RANT: the whole Blob() & Worker() is anything but a clean concept, mess over mess:
               //       for example, to pass a DOM variable to worker via postMessage may create a circular reference
               //       as the data is serialized, e.g. you cannot pass document and in the Worker access document.window.
               //       Dear Google / JavaScript developers: don't make JS unuseable with this mess!
               var blobURL = new Blob([document.querySelector('#conversionWorker').textContent]);
               // -- the messy part coming here:
               //var url = window.URL; url = url.replace(/#.*$/,''); url = url.createObjectURL(blobURL);
               var worker = new Worker(window.webkitURL!==undefined?window.webkitURL.createObjectURL(blobURL):window.URL.createObjectURL(blobURL));
               //var worker = new Worker(window.URL.createObjectURL(blobURL));
               worker.onmessage = function(e) {    // worker finished
                  var data = e.data;
                  //echo("worker end:",data.source,data.filename);
                  if(e.url) data.source = "// Remote retrieve <"+e.url+">\n"+data.source;
                  putSourceInEditor(data.source,data.filename);
                  gProcessor.setJsCad(data.source,data.filename);
               };
               var u = document.location.href;
               u = u.replace(/#.*$/,'');
               u = u.replace(/\?.*$/,'');
               worker.postMessage({url: u, remote: url, source: source, filename: fn }); // start worker
               asyncComputation = true;
            } else {       // async (disabled)
               OpenJsCad.status("Converting "+fn+" <img id=busy src='imgs/busy.gif'>");
               fn.match(/\.(stl|obj|amf|gcode)$/i);
               var type = RegExp.$1;
               if(type=='obj') {
                  editorSource = source = parseOBJ(source,fn);
               } else if(type=='amf') {
                  editorSource = source = parseAMF(source,fn);
               } else if(type=='gcode') {
                  editorSource = source = parseGCode(source,fn);
               } else {
                  editorSource = source = parseSTL(source,fn);
               }
               //if(url) editorSource = source = "// Remote retrieved <"+url+">\n"+editorSource;
               putSourceInEditor(source,fn);
            }
            if(!asyncComputation) {
               gProcessor.setJsCad(source,fn);
            }
         }
      }
      xhr.send();
   }
}
function putSourceInEditor(src,fn) {
   gEditor.setValue(src); 
   gEditor.clearSelection();
   gEditor.navigateFileStart();
   previousFilename = fn;
   previousScript = src;
   gPreviousModificationTime = "";
}









// -----------------------------------------------------------------------------------------------------------
// Drag'n'Drop Functionality
// from old OpenJsCad processfile.html by Joost Nieuwenhuijse,
//     with changes by Rene K. Mueller
// History:
// 2013/04/02: massively upgraded to support multiple-files (chrome & firefox) and entire directory drag'n'drop (chrome only)
// Show all exceptions to the user:
OpenJsCad.AlertUserOfUncaughtExceptions();
function setupDragDrop() {
  // Check for the various File API support.
  if (window.File && window.FileReader && window.FileList) {
    // Great success! All the File APIs are supported.
  } else {
    throw new Error("Error: Your browser does not fully support the HTML File API");
  }
  var dropZone = document.getElementById('filedropzone');
  //var dropZone = document.getElementById('viewerContext');
  dropZone.addEventListener('dragover', function(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy';
  }, false);
  dropZone.addEventListener('drop', handleFileSelect, false);
}
function handleFileSelect(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  gMemFs = []; gMainFile = null;
  if(!evt.dataTransfer) throw new Error("Not a datatransfer (1)");
  if(!evt.dataTransfer.files) throw new Error("Not a datatransfer (2)");
  if(evt.dataTransfer.items&&evt.dataTransfer.items.length) {     // full directories, let's try
    var items = evt.dataTransfer.items;
    gCurrentFiles = [];
    gMemFsCount = 0;
    gMemFsTotal = 0;
    gMemFsChanged = 0;
    gRootFs = [];
    for(var i=0; i<items.length; i++) {
       //var item = items[i];//.webkitGetAsEntry();
       //walkFileTree({file:items[i]});
       walkFileTree(items[i].webkitGetAsEntry());
       gRootFs.push(items[i].webkitGetAsEntry());
    }
  }
  if(browser=='firefox'||me=='web-offline') {     // -- fallback, walkFileTree won't work with file://
     if(evt.dataTransfer.files.length>0) {
       gCurrentFiles = [];                              // -- be aware: gCurrentFiles = evt.dataTransfer.files won't work, as rewriting file will mess up the array
       for(var i=0; i<evt.dataTransfer.files.length; i++) {
         gCurrentFiles.push(evt.dataTransfer.files[i]);  // -- need to transfer the single elements
       }
       loadLocalFiles();
     } else {
       throw new Error("Please drop a single jscad, scad, stl file, or multiple jscad files");
     }
  }
}






function walkFileTree(item,path) {              // this is the core of the drag'n'drop:
                                                //    1) walk the tree
                                                //    2) read the files (readFileAsync)
                                                //    3) re-render if there was a change (via readFileAsync)
   path = path||"";
   //console.log("item=",item);
   if(item.isFile) {
      item.file(function(file) {                // this is also asynchronous ... (making everything complicate)
         if(file.name.match(/\.(jscad|js|scad|obj|stl|amf|gcode)$/)) {   // for now all files OpenJSCAD can handle
            //console.log("walkFileTree File: "+path+item.name);
            gMemFsTotal++;
            gCurrentFiles.push(file);
            readFileAsync(file);
         }
      });
   } else if(item.isDirectory) {
      var dirReader = item.createReader();
      //console.log("walkFileTree Folder: "+item.name);
      dirReader.readEntries(function(entries) {
        // console.log("===",entries,entries.length);
         for(var i=0; i<entries.length; i++) {
            //console.log(i,entries[i]);
            //walkFileTree({item:entries[i], path: path+item.name+"/"});
            walkFileTree(entries[i],path+item.name+"/");
         }
      });
   }
}




function loadLocalFiles() {               // this is the linear drag'n'drop, a list of files to read (when folders aren't supported)
  var items = gCurrentFiles;
  //console.log("loadLocalFiles",items);
  gMemFsCount = 0;
  gMemFsTotal = items.length;
  gMemFsChanged = 0;

  for(var i=0; i<items.length; i++) {
     var f = items[i];
     //console.log(f);
     readFileAsync(f);
     //gMemFs[f.name] = f;
  }
}



function setCurrentFile(file) {              // set one file (the one dragged) or main.jscad
  gCurrentFile = file;
  gPreviousModificationTime = "";
  //console.log("execute: "+file.name);
  if(file.name.match(/\.(jscad|js|scad|stl|obj|amf|gcode)$/i)) {
    gCurrentFile.lang = RegExp.$1;
  } else {
    throw new Error("Please drop a file with .jscad, .scad or .stl extension");
  }
  if(file.size == 0) {
    throw new Error("You have dropped an empty file");
  }
  fileChanged(file);
}
function readFileAsync(f) {                // RANT: JavaScript at its finest: 50 lines code to read a SINGLE file
  var reader = new FileReader();           //       this code looks complicate and it is complicate.
  //console.log("request: "+f.name+" ("+f.fullPath+")");
  reader.onloadend = function(evt) {
     if(evt.target.readyState == FileReader.DONE) {
        var source = evt.target.result;
        //console.log("done reading: "+f.name,source?source.length:0);   // it could have been vanished while fetching (race condition)
        gMemFsCount++;

        if(!gMemFs[f.name]||gMemFs[f.name].source!=source)     // note: assigning f.source = source too make gMemFs[].source the same, therefore as next
          gMemFsChanged++;
        f.source = source;                 // -- do it after comparing

        gMemFs[f.name] = f;                // -- we cache the file (and its actual content)
        if(gMemFsCount==gMemFsTotal) {                // -- are we done reading all?
           //console.log("all "+gMemFsTotal+" files read.");
           if(gMemFsTotal>1||gMemFsCount>1) {         // we deal with multiple files, so we hide the editor to avoid confusion
             $('#editor').hide();
           } else {
             $('#editor').show();
           }

           if(gMemFsTotal>1) {
              if(gMemFs['main.jscad']) {
                 gMainFile = gMemFs['main.jscad'];
              } else if(gMemFs['main.js']) {
                 gMainFile = gMemFs['main.js'];
              } else {
                 for(var fn in gMemFs) {
                   if(gMemFs[fn].name.match(/\/main.jscad$/)||gMemFs[fn].name.match(/\/main.js$/)) {
                      gMainFile = gMemFs[fn];
                   }
                 }
              }
           } else {
             gMainFile = f;
           }
           if(gMemFsChanged>0) {
              if(!gMainFile)
                throw("No main.jscad found");
              //console.log("update & redraw "+gMainFile.name);
              setCurrentFile(gMainFile);
           }
        }

     } else {
        throw new Error("Failed to read file");
        if(gProcessor) gProcessor.clearViewer();
      previousScript = null;
     }
  };
  if(f.name.match(/\.(stl|gcode)$/)) {
     reader.readAsBinaryString(f,"UTF-8");
  } else {
     reader.readAsText(f,"UTF-8");
  }
}




function fileChanged(f) {               // update the dropzone visual & call the main parser
  var dropZone = document.getElementById('filedropzone');
  gCurrentFile = f;
  if(gCurrentFile) {
    var txt;
    if(gMemFsTotal>1) {
       txt = "Current file: "+gCurrentFile.name+" (+ "+(gMemFsTotal-1)+" more files)";
    } else {
       txt = "Current file: "+gCurrentFile.name;
    }
    document.getElementById("currentfile").innerHTML = txt;
    document.getElementById("filedropzone_filled").style.display = "block";
    document.getElementById("filedropzone_empty").style.display = "none";
  } else {
    document.getElementById("filedropzone_filled").style.display = "none";
    document.getElementById("filedropzone_empty").style.display = "block";
  }
  parseFile(f,false,false);
}
function superviseAllFiles(p) {           // check if there were changes: (re-)load all files and check if content was changed
   //var f = gMainFile;                   // note: main functionality lies in readFileAsync()
   //console.log("superviseAllFiles()");

   gMemFsCount = gMemFsTotal = 0;
   gMemFsChanged = 0;

   if(p&&p.forceReload)
      gMemFsChanged++;

   if(!gRootFs||gRootFs.length==0||me=='web-offline') {              // walkFileTree won't work with file:// (regardless of chrome|firefox)
     for(var i=0; i<gCurrentFiles.length; i++) {
        //console.log("[offline] checking "+gCurrentFiles[i].name);
        gMemFsTotal++;
        readFileAsync(gCurrentFiles[i]);
      }
   } else {
      for(var i=0; i<gRootFs.length; i++) {
         walkFileTree(gRootFs[i]);
      }
   }
}




var autoReloadTimer = null;
function toggleAutoReload() {
  if (document.getElementById("autoreload").checked) {
    autoReloadTimer = setInterval(function(){
      //parseFile(gCurrentFile,false,true);
      superviseAllFiles();
    }, 1000);
  } else {
    if (autoReloadTimer !== null) {
      clearInterval(autoReloadTimer);
      autoReloadTimer = null;
    }
  }
}




var previousScript = null;
function parseFile(f, debugging, onlyifchanged) {     // here we convert the file to a renderable source (jscad)
  if(arguments.length==2) {
    debugging = arguments[1];
    onlyifchanged = arguments[2];
    f = gCurrentFile;
  }
  //gCurrentFile = f;
  var source = f.source;
  var editorSource = source;
  if(source == "") {
    if(document.location.toString().match(/^file\:\//i)) {
      throw new Error("Could not read file. You are using a local copy of OpenJSCAD.org; if you are using Chrome, you need to launch it with the following command line option:\n\n--allow-file-access-from-files\n\notherwise the browser will not have access to uploaded files due to security restrictions.");
    } else {
      throw new Error("Could not read file.");
    }
  } else {
    if(gProcessor && ((!onlyifchanged) || (previousScript !== source))) {
      var fn = gCurrentFile.name;
      fn = fn.replace(/^.*\/([^\/]*)$/,"$1");     // remove path, leave filename itself
      gProcessor.setDebugging(debugging);
      //echo(gCurrentFile.lang);
      //gEditor.getSession().setMode("ace/mode/javascript");
      var asyncComputation = false;

      if(gCurrentFile.lang=='jscad'||gCurrentFile.lang=='js') {
         ; // default
      } else if(gCurrentFile.lang=='scad') {
         editorSource = source;
         if(!editorSource.match(/^\/\/!OpenSCAD/i)) {
            editorSource = "//!OpenSCAD\n"+editorSource;
         }
         source = openscadOpenJscadParser.parse(editorSource);
         if(0) {
            source = "// OpenJSCAD.org: scad importer (openscad-openjscad-translator) '"+fn+"'\n\n"+source;
         }
         //gEditor.getSession().setMode("ace/mode/scad");

      } else if(gCurrentFile.lang.match(/(stl|obj|amf|gcode)/i)) {
         status("Converting "+fn+" <img id=busy src='imgs/busy.gif'>");
         if(!fn.match(/amf/i)) {     // -- if you debug the STL parsing, change it to 'if(0&&...' so echo() works, otherwise in workers
                                     //    echo() is not working.., and parseAMF requires jquery, which seem not working in workers
            var blobURL = new Blob([document.querySelector('#conversionWorker').textContent]);
            // -- the messy part coming here:
            var worker = new Worker(window.webkitURL!==undefined?window.webkitURL.createObjectURL(blobURL):window.URL.createObjectURL(blobURL));
            worker.onmessage = function(e) {
               var data = e.data;
               //echo("finished converting, source:",data.source);
               if(data&&data.source&&data.source.length) {              // end of async conversion
                  putSourceInEditor(data.source,data.filename);
                  gMemFs[data.filename].source = data.source;
                  gProcessor.setJsCad(data.source,data.filename);
               } else {
                  // worker responds gibberish (likely echo(), but format unknown)
                  // echo("STL worker",data);
               }
            };
            var u = document.location.href;
            u = u.replace(/#.*$/,'');
            u = u.replace(/\?.*$/,'');
            worker.postMessage({url: u, source: source, filename: fn });
            asyncComputation = true;
         } else {
            fn.match(/\.(stl|obj|amf|gcode)$/i);
            var type = RegExp.$1;
            if(type=='obj') {
               editorSource = source = parseOBJ(source,fn);
            } else if(type=='amf') {
               editorSource = source = parseAMF(source,fn);
            } else if(type=='gcode') {
               editorSource = source = parseGCode(source,fn);
            } else {
               editorSource = source = parseSTL(source,fn);
            }
         }
      } else {
         throw new Error("Please drop a file with .jscad, .scad or .stl extension");
      }
      if(!asyncComputation) {                   // end of synchronous conversion
         putSourceInEditor(editorSource,fn);
         gMemFs[fn].source = source;
         gProcessor.setJsCad(source,fn);
      }
    }
  }
}







function setCookie(name, value, days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        var expires = "; expires=" + date.toGMTString();
    } else var expires = "";
    document.cookie = escape(name) + "=" + escape(value) + expires + "; path=/";
}


function getCookie(name) {
    var nameEQ = escape(name) + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return unescape(c.substring(nameEQ.length, c.length));
    }
    return null;
}


function deleteCookie(name) {
    createCookie(name, "", -1);
}


