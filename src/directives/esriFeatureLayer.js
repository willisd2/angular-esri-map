(function (angular) {
    'use strict';

    angular.module('esri.map').directive('esriFeatureLayer', function ($q) {
        // this object will tell angular how our directive behaves
        return {
            // only allow esriFeatureLayer to be used as an element (<esri-feature-layer>)
            restrict: 'E',

            // require the esriFeatureLayer to have its own controller as well an esriMap controller
            // you can access these controllers in the link function
            require: ['esriFeatureLayer', '^esriMap'],

            // replace this element with our template.
            // since we aren't declaring a template this essentially destroys the element
            replace: true,

            // define an interface for working with this directive
            controller: function ($scope, $element, $attrs) {
                var layerDeferred = $q.defer();

                require([
                    'esri/layers/FeatureLayer'], function (FeatureLayer) {
                        var urlRegex = /(http:\/\/|https:\/\/)/;  // simple url regex
                        var isUrl = urlRegex.test($attrs.url);
                        var layerUrl;

                        if (isUrl) {
                            layerUrl = $attrs.url;
                        }
                        else {
                            layerUrl = $scope.$eval($attrs.url);
                        }

                        var layer = new FeatureLayer(layerUrl);

                        layerDeferred.resolve(layer);
                    });

                // return the defered that will be resolved with the feature layer
                this.getLayer = function () {
                    return layerDeferred.promise;
                };

                // set the visibility of the feature layer
                this.setVisible = function (isVisible) {
                    var visibleDeferred = $q.defer();

                    this.getLayer().then(function (layer) {
                        if (isVisible === true || isVisible.toString().toLowerCase() === 'true') {
                            layer.show();
                        }
                        else if (isVisible === false || isVisible.toString().toLowerCase() === 'false') {
                            layer.hide();
                        }

                        visibleDeferred.resolve();
                    });

                    return visibleDeferred.promise;
                };
            },

            // now we can link our directive to the scope, but we can also add it to the map..
            link: function (scope, element, attrs, controllers) {
                // controllers is now an array of the controllers from the 'require' option
                var layerController = controllers[0];
                var mapController = controllers[1];

                var visible = attrs['visible'] || true;
                var isVisible = scope.$eval(visible);

                // set the initial visible state of the feature layer
                layerController.setVisible(isVisible);

                // add a $watch condition on the visible attribute, if it changes and the new value is different than the previous, then use to
                // set the visibility of the feature layer
                scope.$watch(function () { return scope.$eval(attrs['visible']); }, function (newVal, oldVal) {
                    if (newVal !== oldVal) {
                        layerController.setVisible(newVal);
                    }
                });

                layerController.getLayer().then(function (layer) {
                    // add layer
                    mapController.addLayer(layer);

                    //look for layerInfo related attributes. Add them to the map's layerInfos array for access in other components
                    mapController.addLayerInfo({
                        title: attrs.title || layer.name,
                        layer: layer,
                        hideLayers: (attrs.hideLayers) ? attrs.hideLayers.split(',') : undefined,
                        defaultSymbol: (attrs.defaultSymbol) ? JSON.parse(attrs.defaultSymbol) : true
                    });

                    // return the layer
                    return layer;
                });
            }
        };
    });

})(angular);
