###
MiniMVC: A lightweight MVC Structuring Harness
The entire purpose of MiniMVC is to get out of the way. If you've selected your
own router, template layer, etc, you may just want an easy way to organize the
code. That's where MiniMVC comes in.

What MiniMVC is
* Code Structure - directories for /controllers, /models, and /views
* Light - scans the file structure once on server start
* Convienent - quick access via MiniMVC.controller("Name", params)

What MiniMVC is not
* A router (there's plenty of those around)
* Middleware (probably because I haven't learned Connect well enough yet)

How do I use it?
require("MiniMVC").boot(__dirname, function () {
  // directories scanned and loaded
  server = require("http").createServer(function(request, response, function) {
    // make some decisions about where to route
    // params is an object with additional key/values you create or take from a router
    require("MiniMVC").begin(request, response, params).controller("Root").index()
  });
});

// and in controllers/rootcontroller.js
// if you aren't using coffeescript, you need to extend Controller, and call
// the super class' constructor()
Controller = require("MiniMVC").Controller
class RootController extends Controller
  index: () ->
    // the following methods are available
    // @request(): get the request
    // @response(): get the response (null for models)
    // @params(): get the params

exports.Root = RootController
###

fs = require("fs")
Seq = require("seq")
sys = require("sys")

root = null

directories =
  controllers: "controllers"
  models: "models"
  views: "views"

objectRegistries =
  controllers: {}
  models: {}
  views: {}
  
getRoot = () ->
  return root

directory = (name, path) ->
  if path?
    directories[name] = path
    objectRegistries[name] = {}
  else
    return directories[name]

allDirectories = () ->
  return directories

objectRegistry = (name, type, obj) ->
  if obj?
    objectRegistries[type][name] = obj
  else
    return objectRegistries[type][name]

boot = (rootDirectory, callback) ->
  root = rootDirectory
  order = []
  
  # Scan the directories under root to acquire our objects
  Seq()
  .seq_ (next) =>
    payload = []
    for own type, path of allDirectories()
      order.push(type)
      payload.push({
        type: type,
        path: path
      })
    next.ok(payload)
  .flatten()
  .parEach_ (next, item) =>
    loadFiles(item.type, item.path, next.into(item.type))
  .seq_ (next) =>
    out = []
    for type in order
      out.push("#{next.vars[type]} #{type}")
    sys.log "MiniMVC booted successfully: #{out.join(', ')}"
    if callback?
      callback()
  .catch (err) ->
    console.log err
    throw err

loadFiles = (type, path, callback) ->
  fullDirectory = "#{root}/#{path}"
  files = 0
  invalidFile = /^(~|\.)/
  Seq()
  .seq_ (next) =>
    fs.readdir(fullDirectory, next)
  .flatten()
  .parEach_ (next, file) =>
    if not invalidFile.test file
      # this is not technically commonjs compliant, but ok in node
      temp = require(fullDirectory + "/" + file)
      for own exportName, exportObject of temp
        objectRegistry(exportName, type, exportObject)
        files++
    next.ok()
  .seq_ (next) =>
    callback(null, files)
  .catch (err) ->
    callback(err, null)

begin = (request, response, params) ->
  return new MiniMVC(request, response, params)

end = (response) ->
  return (args...) ->
    # count the number of args passed
    if args.length is 2 and !args[0] then response.end(args[1])
    else if args.length is 2 and args[0] then throw args[0]
    else response.end(args[0])


class MiniMVC
  constructor: (request, response, params) ->
    @request = () ->
      return request
    @response = () ->
      return response
    @params = () ->
      return params
  create: (name, type) ->
    definition = objectRegistry(name, type)
    obj = new definition(@request(), @response(), @params())
    return obj
  controller: (name) ->
    return @create(name, "controllers")
  model: (name) ->
    return @create(name, "models")
  view: (name) ->
    return @create(name, "views")

# MiniMVCController
# a simple class all MiniMVC stuff can inherit from
class MiniMVCController extends MiniMVC
  constructor: (request, response, params) ->
    super

# MiniMVCModel
# a simple class all MiniMVC stuff can inherit from
class MiniMVCModel extends MiniMVC
  constructor: (request, response, params) ->
    # responses are not available in models
    response = null
    super

# MiniMVCView
# a simple class all MiniMVC stuff can inherit from
class MiniMVCView extends MiniMVC
  constructor: (request, response, params) ->
    super

exports.directory = directory
exports.boot = boot
exports.begin = begin
exports.end = end
exports.root = getRoot
exports.Controller = MiniMVCController
exports.Model = MiniMVCModel
exports.View = MiniMVCView
