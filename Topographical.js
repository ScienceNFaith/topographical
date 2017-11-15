/** Assumptions
  * The drawn paths on map with outline color of #000000 are ascending contour lines
  * The drawn paths on map with outline color of #980000 are descending contour lines
  * Distance between contours equals the page scale
**/

var Topographical = Topographical || (function(){
    'use strict';
    
    var contours = {},      //{ pageid:[path,...],...}
        ascending = "#000000",
        descending = "#980000",
        layer = 'map',
    
    RegisterEventHandlers = function() {
		loadContours();
		on('chat:message', HandleInput);
        on('add:path',addContour);
        on('destroy:path',removeContour);
    },
    HandleInput = function(msg_orig) {
        var msg     = _.clone(msg_orig);
        if (msg.type !== "api") {
			return;
		}
		
		var args = msg.content.split(/\s+/);
		if(args[0] == '!topo') {
    		switch(args[1]) {
    		    case 'getHeight':
    		        var height = getHeight(args[2]),
    		            token = getObj('graphic',args[2]),
    		            page = getObj('page',token.get('pageid'));
    		        sendChat('',`${height}${page.get('scale_units')}`);
    		        break;
    		    case 'setAscending':
    		        //if(matchpattern())
    		        ascending = args[2];
    		        loadContours();
    		        sendChat('',`Ascending set to ${ascending}`);
    		        break;
    		    case 'setDescending':
    		        //if(matchpattern())
    		        descending = args[2];
    		        loadContours();
                    sendChat('',`Descending set to ${descending}`);
    		        break;
    		    case 'setLayer':
    		        //if(matchpattern())
    		        layer = args[2];
    		        loadContours();
    		        sendChat('',`Layer set to ${layer}`);
    		        break;
    		    case 'help':
    		        sendChat('','getHeight \<token id\> <br>setAscending \<#000000\> <br>setDescending \<#980000\>');
    		        break;
    		}
		}
		
		return;
    },
    loadContours = function() {
        _.forEach(findObjs({ type: 'page' }),function(page){
            var pageid = page.id;
            var paths = findObjs({ type: 'path', pageid: pageid, layer: layer, stroke: ascending });
            paths.push.apply(paths,findObjs({ type: 'path', pageid: pageid, layer: layer, stroke: descending }));
            contours[pageid] = paths;
        });
    },
    addContour = function(path) {
        if(path.get('layer') == layer && (path.get('fill') == ascending || path.get('fill') == descending)) {
            contours[path.get('pageid')].push(path);
        }
    },
    removeContour = function(path) {
        if(path.get('layer') == layer && (path.get('fill') == ascending || path.get('fill') == descending)) {
            var index = contours[path.get('pageid')].indexOf(path);
            contours[path.get('pageid')].splice(index,1);
        }
    },
    getHeight = function(token_id) {
        var token = getObj('graphic',token_id);
        var pageid = token.get('pageid');
        var page = getObj('page',pageid);
        var w = token.get('width');
        var h = token.get('height');
        var counter = 0;
        token.set({
            width:1,
            height:1
        });
        _.forEach(contours[pageid],function(contour){
            if(TokenCollisions.isOverlapping(token,contour)) {
                if(contour.get('fill') == ascending) counter++;
                else if (contour.get('fill') == descending) counter--;
            }
        });
        token.set({
            width:w,
            height:h
        })
        return counter*parseFloat(page.get('scale_number'));
    };
    
    return {
    	RegisterEventHandlers: RegisterEventHandlers, 
    	getHeight:  getHeight
    };
}());



on("ready",function(){
	'use strict';
	Topographical.RegisterEventHandlers();
});