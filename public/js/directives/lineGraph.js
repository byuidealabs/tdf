// Built from Nathan's bar graph example

angular.module('tdf').directive('lineGraph',
    ['$window', '$timeout', 'd3Service',
    function($window, $timeout, d3Service) {
        return {
            restrict: 'EA',
            scope: {
                data: '='  // Bi-directional binding
            },
            link: function(scope, ele, attrs) {
                d3Service.d3().then(function(d3) {
                    var renderTimeout;
                    // Allow users to set line width, default is 4
                    var lineWidth = parseInt(attrs.lineWidth) || 4;

                    // The width of the line graph is 100%
                    // of the window size (used for resizing window)
                    var svg = d3.select(ele[0])
                        .append('svg')
                        .style('width', '100%');

                    // Apply changes to scope when resized
                    // (I believe this only affects the width of
                    // the inputs and bar graph)
                    $window.onresize = function() {
                        scope.$apply();
                    };

                    // This watches for the window to be resized
                    scope.$watch(function() {
                        return angular.element($window)[0].innerWidth;
                    }, function() {
			// This tells the page to draw the data
                        scope.render(scope.data);
                    });

                    // Apply changes when the array is changed
                    scope.$watch('data', function(newData) {
                        scope.render(newData);
                    }, true);

                    // This tells us how the data is displayed
                    scope.render = function(data) {
			// This removes all previously drawn items
			// before drawing anything new
                        svg.selectAll('*').remove();

			// If no data is passed, don't draw
                        if (!data) return;
			// Not sure exactly what this does, but I believe
			// it times out if something takes too long to draw
                        if (renderTimeout) clearTimeout(renderTimeout);

                        renderTimeout = $timeout(function() {
                            var color = d3.scale.category20();

                            //This draws the lines
                            svg.selectAll('polyline')
                                .data(data)
                                .enter()
                                .append('polyline')
                                .attr('points', function(d,i){
                                    var test = [];
                                    var thePoints = '';
                                    for (var k = 0; k < data[i].score.length; k++) {
                                        test.push((k+1)*100);
                                        thePoints = thePoints + test[k] +
                                            ', ' + data[i].score[k] + ' ';
                                    }
                                    return thePoints;
                                })
                                .style('fill', 'none')
                                .style('stroke-width', lineWidth)
                                .style('stroke', function(d,i) { return color(data[i].score); });

                            // Draw y axis
                            svg.append('line')
                                .attr('x1', 100)
                                .attr('y1', 0)
                                .attr('x2', 100)
                                .attr('y2', 100)
                                .attr('stroke','black')
                                .attr('stroke-width',lineWidth);

                            // Draw x axis
                            svg.append('line')
                                .attr('x1', 100-2)
                                .attr('y1', 0)
                                .attr('x2', 100*data[0].score.length+2)
                                .attr('y2', 0)
                                .attr('stroke','black')
                                .attr('stroke-width',lineWidth*2);

                            // Draw grid lines
                            svg.selectAll('line')
                                .data(data)
                                .enter()
                                .append('line')
                                .attr('x1', function(){return 150;})
                                .attr('y1', function(){return 150;})
                                .attr('x2', function(){return 150;})
                                .attr('y2', function(){return 150;})
                                .attr('stroke','black')
                                .attr('stroke-width',lineWidth);

                            // This writes the names
                            svg.selectAll('text')
                                .data(data)
                                .enter()
                                .append('text')
                                .attr('fill', '#000')
                                .attr('y', function(d,i) {
                                    return i * 40 + 15;
                                })
                                .attr('x', 15)
                                .text(function(d) {
                                return d.name;
                            });

                        }, 200);
                    };
                });
            }
        };
    }]);
