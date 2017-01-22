angular.module('openwindow').controller('postctrl', [
        '$scope',
        '$http',
        '$window',
        '$interval',
        'geolocation',
        'INT_CONSTANTS',
        function($scope, $http, $window, $interval, geolocation, INT_CONSTANTS) {
            // must be consistent with their usages in server.js
            // TODO: Put in INT_CONSTANTS
            var UPVOTE = 2;
            var DOWNVOTE = 1;
            var NONE = 0;

            $scope.upvote = function() {
                $scope.vote(UPVOTE);
            }
            $scope.downvote = function() {
                $scope.vote(DOWNVOTE);
            }
            $scope.comments = function() {
                var urlWithPostId = '#/comments?postId=' + $scope.post.id;
                $window.location.href = geolocation.addLocationToURL(urlWithPostId, $scope.location);
            }
            $scope.vote = function(vote) {
                var oldVote = NONE;
                if ($scope.post.upvoted) {
                    oldVote = UPVOTE;
                } else if ($scope.post.downvoted) {
                    oldVote = DOWNVOTE;
                }
                $scope.updatePostVote(vote, function(success) {
                    if (success) {
                        if (vote == UPVOTE && oldVote == UPVOTE) {
                            $scope.post.upvoted = false;
                        } else if (vote == DOWNVOTE && oldVote == DOWNVOTE) {
                            $scope.post.downvoted = false;
                        } else if (vote == UPVOTE) {
                            $scope.post.upvoted = true;
                            $scope.post.downvoted = false;
                        } else if (vote == DOWNVOTE) {
                            $scope.post.upvoted = false;
                            $scope.post.downvoted = true;
                        } else {
                            $scope.post.upvoted = false;
                            $scope.post.downvoted = false;
                        }
                    }
                });
            }
            $scope.updatePostTimeStr = function() {
                var timeRemaining = $scope.getSecondsRemaining();
                if (timeRemaining < 0 || timeRemaining == undefined) {
                    $scope.hidePost = true;
                    return;
                } else {
                    $scope.hidePost = false;
                }
                if (timeRemaining < 60 * 60) {
                    $scope.post.time_str = Math.ceil(timeRemaining / 60) + " min";
                } else if (timeRemaining < 60 * 60 * 24) {
                    $scope.post.time_str = Math.floor(timeRemaining / 3600) + " hr";
                } else if (timeRemaining < 60 * 60 * 24 * 2) {
                    $scope.post.time_str = "1 day";
                } else {
                    $scope.post.time_str = Math.floor(timeRemaining / 21600) + " days";
                }
            }
            $scope.$watch("post.secondsToShowFor", function(newval, oldval) {
                $scope.updatePostTimeStr();
            });
            var POST_UPDATE_INTERVAL = 10000;
            $interval(function() {
               $scope.updatePostTimeStr(); 
            }, POST_UPDATE_INTERVAL);
            $scope.updatePostVote = function(vote, callback) {
                var call = "/api/" + getVoteCall(vote);
                var params = $scope.location;
                params.radius = INT_CONSTANTS.POST_RADIUS;
                $http.post(call, {id:$scope.post.id, oldVote:$scope.getPostStatus($scope.post)}, {params:params})
                     .success(function(response) {
                         var post = response.body;
                         if (post.secondsToShowFor) {
                            $scope.post.secondsToShowFor = post.secondsToShowFor;
                         }
                         callback(true);
                     })
                     .error(function(error) {
                         callback(false);
                     });
            }
            $scope.getPostStatus = function() {
                if ($scope.post.upvoted) {
                    return UPVOTE;
                } else if ($scope.post.downvoted) {
                    return DOWNVOTE;
                }
                return NONE;
            }
            getVoteCall = function(status) {
                if (status == UPVOTE) {
                    return "upvote";
                } else if (status == DOWNVOTE) {
                    return "downvote";
                }
                return "";
            }
            $scope.getSecondsRemaining = function() {
                if ($scope.post.secondsToShowFor == undefined) {
                    return undefined;
                }
                var millsSincePosting = Date.now() - $scope.post.timePostedMills;
                return $scope.post.secondsToShowFor - (millsSincePosting / 1000);
            }
        }
]);
