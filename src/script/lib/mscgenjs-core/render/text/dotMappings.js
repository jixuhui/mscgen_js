/* istanbul ignore else */
if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function() {
    "use strict";

    /**
     * Defines several mappings of arckinds to agregations
     *
     * @exports node/arcmappings
     * @author {@link https://github.com/sverweij | Sander Verweij}
     */
    var KIND2ARROW = {
        "->" : "rvee",
        "<->" : "rvee",
        "=>" : "normal",
        "<=>" : "normal",
        "-x" : "oinvonormal"
    };
    var KIND2SHAPE = {
        "box" : "box",
        "abox" : "hexagon",
        "rbox" : "box",
        "note" : "note"
    };
    var KIND2STYLE = {
        ">>" : "dashed",
        "<<>>" : "dashed",
        ".." : "dashed",
        ":>" : "bold",
        "<:>" : "bold",
        "::" : "bold",
        "rbox" : "rounded"
    };

    return {
        // dot only
        getArrow : function(pKey) { return KIND2ARROW[pKey]; },
        getShape : function(pKey) { return KIND2SHAPE[pKey]; },
        getStyle : function(pKey) { return KIND2STYLE[pKey]; }
    };
});
/*
 This file is part of mscgen_js.

 mscgen_js is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 mscgen_js is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with mscgen_js.  If not, see <http://www.gnu.org/licenses/>.
 */
