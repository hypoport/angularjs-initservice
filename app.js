var myModule = angular.module('myModule', []);

myModule.factory('init', function ($q, $rootScope, $browser) {

  var initFunctions = [
    'controllerWithInitialization'
  ];
  var registeredInitFunctions = {};
  var initialized = false;

  var initApplication = function () {
    var controllerWithInitialization = registeredInitFunctions['controllerWithInitialization'];

    var broadcastAppInitialized = function () {
      $browser.defer(function () {
        initialized = true;
        $rootScope.$apply(function () {
          $rootScope.$broadcast('appInitialized');
        });
      });
    };
    controllerWithInitialization.init()
      .then(broadcastAppInitialized);
  };

  $rootScope.$on('$routeChangeStart', function () {
    registeredInitFunctions = {};
    initialized = false;
  });

  var initAppWhenReady = function () {
    var registeredInitFunctionNames = _.keys(registeredInitFunctions);
    var isRegistered = _.partial(_.contains, registeredInitFunctionNames);
    if (_.every(initFunctions, isRegistered)) {
      initApplication();
      registeredInitFunctions = null;
    }
  };

  var init = function (name, dependencies, initCallback) {
    registeredInitFunctions[name] = {
      init: function () {
        var internalDependencies = $q.all(dependencies);
        return internalDependencies.then(initCallback);
      }};
    initAppWhenReady();
  };

  init.watchAfterInit = function (scope, expression, listener, deepEqual) {
    scope.$watch(expression, function (newValue, oldValue, listenerScope) {
      if (initialized) {
        listener(newValue, oldValue, listenerScope);
      }
    }, deepEqual);
  };

  init.onAfterInit = function (scope, event, listener) {
    scope.$on(event, function (event) {
      if (initialized) {
        listener(event);
      }
    });
  };

  return  init;
});

myModule.service('myService', function ($http) {
  $http.defaults.headers.post['Content-Type'] = "application/x-www-form-urlencoded; charset=UTF-8";
  this.getOptions = function () {
    return $http({
      "method": "post",
      "url": 'http://jsfiddle.net/echo/json/',
      "data": "delay=3&json=" + encodeURI(JSON.stringify({
        options: [
          {name: 'entry1', value: 0},
          {name: 'entry2', value: 1},
          {name: 'entry3', value: 2}
        ]
      }))
    });
  };
});

myModule.controller('simpleController', function ($scope, myService) {
  $scope.selectedOption = null;
  $scope.options = [];
  $scope.logentries = [];
  myService.getOptions().then(function (result) {
    $scope.options = result.data.options;
    $scope.selectedOption = 0;
  });
  $scope.$watch('selectedOption', function (newValue, oldValue) {
    // handle selection change ...
    console.log("selection: " + $scope.selectedOption);
    $scope.logentries.push(($scope.logentries.length + 1) + " - selection: " + $scope.selectedOption);
  });
});

myModule.controller('controllerWithInitialization', function ($scope, myService, init) {
  $scope.selectedOption = null;
  $scope.options = [];
  $scope.logentries = [];
  init('controllerWithInitialization', [myService.getOptions()], function (result) {
    $scope.options = result[0].data.options;
    $scope.selectedOption = 0;
  });
  init.watchAfterInit($scope, 'selectedOption', function (newValue, oldValue) {
    // handle selection change ...
    console.log("selection: " + $scope.selectedOption);
    $scope.logentries.push(($scope.logentries.length + 1) + " - selection: " + $scope.selectedOption);
  });

  $scope.$on('appInitialized', function () {
    console.log("appInitialized - selection: " + $scope.selectedOption);
    $scope.logentries.push(($scope.logentries.length + 1) + " - appInitialized - selection: " + $scope.selectedOption);
  });
});
