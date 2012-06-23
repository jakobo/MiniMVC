(function() {
  /*
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
  */  var MiniMVC, MiniMVCController, MiniMVCModel, MiniMVCView, Seq, allDirectories, begin, boot, directories, directory, end, fs, getRoot, loadFiles, objectRegistries, objectRegistry, root, sys;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __slice = Array.prototype.slice, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  fs = require("fs");
  Seq = require("seq");
  util = require('util');
  root = null;
  directories = {
    controllers: "controllers",
    models: "models",
    views: "views"
  };
  objectRegistries = {
    controllers: {},
    models: {},
    views: {}
  };
  getRoot = function() {
    return root;
  };
  directory = function(name, path) {
    if (path != null) {
      directories[name] = path;
      return objectRegistries[name] = {};
    } else {
      return directories[name];
    }
  };
  allDirectories = function() {
    return directories;
  };
  objectRegistry = function(name, type, obj) {
    if (obj != null) {
      return objectRegistries[type][name] = obj;
    } else {
      return objectRegistries[type][name];
    }
  };
  boot = function(rootDirectory, callback) {
    var order;
    root = rootDirectory;
    order = [];
    return Seq().seq_(__bind(function(next) {
      var path, payload, type, _ref;
      payload = [];
      _ref = allDirectories();
      for (type in _ref) {
        if (!__hasProp.call(_ref, type)) continue;
        path = _ref[type];
        order.push(type);
        payload.push({
          type: type,
          path: path
        });
      }
      return next.ok(payload);
    }, this)).flatten().parEach_(__bind(function(next, item) {
      return loadFiles(item.type, item.path, next.into(item.type));
    }, this)).seq_(__bind(function(next) {
      var out, type, _i, _len;
      out = [];
      for (_i = 0, _len = order.length; _i < _len; _i++) {
        type = order[_i];
        out.push("" + next.vars[type] + " " + type);
      }
      util.log("MiniMVC booted successfully: " + (out.join(', ')));
      if (callback != null) {
        return callback();
      }
    }, this))["catch"](function(err) {
      console.log(err);
      throw err;
    });
  };
  loadFiles = function(type, path, callback) {
    var files, fullDirectory, invalidFile;
    fullDirectory = "" + root + "/" + path;
    files = 0;
    invalidFile = /^(~|\.)/;
    return Seq().seq_(__bind(function(next) {
      return fs.readdir(fullDirectory, next);
    }, this)).flatten().parEach_(__bind(function(next, file) {
      var exportName, exportObject, temp;
      if (!invalidFile.test(file)) {
        temp = require(fullDirectory + "/" + file);
        for (exportName in temp) {
          if (!__hasProp.call(temp, exportName)) continue;
          exportObject = temp[exportName];
          objectRegistry(exportName, type, exportObject);
          files++;
        }
      }
      return next.ok();
    }, this)).seq_(__bind(function(next) {
      return callback(null, files);
    }, this))["catch"](function(err) {
      return callback(err, null);
    });
  };
  begin = function(request, response, params) {
    return new MiniMVC(request, response, params);
  };
  end = function(response) {
    return function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (args.length === 2 && !args[0]) {
        return response.end(args[1]);
      } else if (args.length === 2 && args[0]) {
        throw args[0];
      } else {
        return response.end(args[0]);
      }
    };
  };
  MiniMVC = (function() {
    function MiniMVC(request, response, params) {
      this.request = function() {
        return request;
      };
      this.response = function() {
        return response;
      };
      this.params = function() {
        return params;
      };
    }
    MiniMVC.prototype.create = function(name, type) {
      var definition, obj;
      definition = objectRegistry(name, type);
      obj = new definition(this.request(), this.response(), this.params());
      return obj;
    };
    MiniMVC.prototype.controller = function(name) {
      return this.create(name, "controllers");
    };
    MiniMVC.prototype.model = function(name) {
      return this.create(name, "models");
    };
    MiniMVC.prototype.view = function(name) {
      return this.create(name, "views");
    };
    return MiniMVC;
  })();
  MiniMVCController = (function() {
    __extends(MiniMVCController, MiniMVC);
    function MiniMVCController(request, response, params) {
      MiniMVCController.__super__.constructor.apply(this, arguments);
    }
    return MiniMVCController;
  })();
  MiniMVCModel = (function() {
    __extends(MiniMVCModel, MiniMVC);
    function MiniMVCModel(request, response, params) {
      response = null;
      MiniMVCModel.__super__.constructor.apply(this, arguments);
    }
    return MiniMVCModel;
  })();
  MiniMVCView = (function() {
    __extends(MiniMVCView, MiniMVC);
    function MiniMVCView(request, response, params) {
      MiniMVCView.__super__.constructor.apply(this, arguments);
    }
    return MiniMVCView;
  })();
  exports.directory = directory;
  exports.boot = boot;
  exports.begin = begin;
  exports.end = end;
  exports.root = getRoot;
  exports.Controller = MiniMVCController;
  exports.Model = MiniMVCModel;
  exports.View = MiniMVCView;
}).call(this);
