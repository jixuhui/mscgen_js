/*
 * takes an abstract syntax tree for a message sequence chart and renders it
 * as an graphviz dot script.
 */

/* istanbul ignore else */
if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function(require) {
    "use strict";

    var wrap          = require("../textutensils/wrap");
    var flatten       = require("../astmassage/flatten");
    var dotMappings   = require("./dotMappings");
    var aggregatekind = require("../astmassage/aggregatekind");
    var _             = require("../../lib/lodash/lodash.custom");

    var INDENT = "  ";
    var MAX_TEXT_WIDTH = 40;
    var gCounter = 0;

    function _renderAST(pAST) {
        var lRetVal =
            "/* Sequence chart represented as a directed graph\n" +
            " * in the graphviz dot language (http://graphviz.org/)\n" +
            " *\n" +
            " * Generated by mscgen_js (https://sverweij.github.io/mscgen_js)\n" +
            " */\n" +
            "\n" +
            "graph {\n";
        lRetVal += INDENT + 'rankdir=LR\n';
        lRetVal += INDENT + 'splines=true\n';
        lRetVal += INDENT + 'ordering=out\n';
        lRetVal += INDENT + 'fontname="Helvetica"\n';
        lRetVal += INDENT + 'fontsize="9"\n';
        lRetVal += INDENT + 'node [style=filled, fillcolor=white fontname="Helvetica", fontsize="9" ]\n';
        lRetVal += INDENT + 'edge [fontname="Helvetica", fontsize="9", arrowhead=vee, arrowtail=vee, dir=forward]\n';
        lRetVal += "\n";

        if (pAST) {
            if (pAST.entities) {
                lRetVal += renderEntities(pAST.entities) + "\n";
            }
            if (pAST.arcs) {
                gCounter = 0;
                lRetVal += renderArcLines(pAST.arcs, "");
            }
        }
        return lRetVal += "}";
    }

    /* Attribute handling */
    function renderString(pString) {
        var lStringAry = wrap.wrap(pString.replace(/"/g, "\\\""), MAX_TEXT_WIDTH);
        var lString = lStringAry.slice(0, -1).reduce(function(pPrev, pLine){
            return pPrev + pLine + "\n";
        }, "");
        lString += lStringAry.slice(-1);
        return lString;
    }

    function renderAttribute(pAttr, pString){
        return pString + "=\"" + renderString(pAttr) + "\"";
    }

    function pushAttribute(pArray, pAttr, pString) {
        if (Boolean(pAttr)) {
            pArray.push(renderAttribute(pAttr, pString));
        }
    }

    function translateAttributes(pThing) {
        return ["label", "color", "fontcolor", "fillcolor"].filter(function(pSupportedAttr){
            return Boolean(pThing[pSupportedAttr]);
        }).map(function(pSupportedAttr) {
            return renderAttribute(pThing[pSupportedAttr], pSupportedAttr);
        });
    }

    function renderAttributeBlock(pAttrs) {
        var lRetVal = "";
        if (pAttrs.length > 0) {
            lRetVal = pAttrs.slice(0, -1).reduce(function (pPrev, pAttr){
                return pPrev + pAttr + ", ";
            }, " [");
            lRetVal += pAttrs.slice(-1) + "]";
        }
        return lRetVal;
    }

    /* Entity handling */
    function renderEntityName(pString) {
        return "\"" + pString + "\"";
    }

    function renderEntity(pEntity) {
        return renderEntityName(pEntity.name) +
               renderAttributeBlock(translateAttributes(pEntity));
    }

    function renderEntities(pEntities) {
        return pEntities.reduce(function(pPrev, pEntity) {
            return pPrev + INDENT + renderEntity(pEntity) + ";\n";
        }, "");
    }

    /* ArcLine handling */
    function counterizeLabel(pLabel, pCounter) {
        if (pLabel) {
            return "(" + pCounter + ") " + pLabel;
        } else {
            return "(" + pCounter + ")";
        }
    }

    function renderBoxArc(pArc, pCounter, pIndent) {
        var lRetVal = "";
        var lBoxName = "box" + pCounter.toString();
        lRetVal += lBoxName;
        var lAttrs = translateAttributes(pArc);
        pushAttribute(lAttrs, dotMappings.getStyle(pArc.kind), "style");
        pushAttribute(lAttrs, dotMappings.getShape(pArc.kind), "shape");

        lRetVal += renderAttributeBlock(lAttrs) + "\n" + INDENT + pIndent;

        lAttrs = [];
        pushAttribute(lAttrs, "dotted", "style");
        pushAttribute(lAttrs, "none", "dir");

        lRetVal += lBoxName + " -- {" + renderEntityName(pArc.from) + "," + renderEntityName(pArc.to) + "}";
        lRetVal += renderAttributeBlock(lAttrs);

        return lRetVal;
    }

    function renderRegularArc(pArc, pAggregatedKind, pCounter) {
        var lRetVal = "";
        pArc.label = counterizeLabel(pArc.label, pCounter);
        var lAttrs = translateAttributes(pArc);

        pushAttribute(lAttrs, dotMappings.getStyle(pArc.kind), "style");
        switch (pAggregatedKind) {
        case ("directional") :
            {
                pushAttribute(lAttrs, dotMappings.getArrow(pArc.kind), "arrowhead");
            }
            break;
        case ("bidirectional"):
            {
                pushAttribute(lAttrs, dotMappings.getArrow(pArc.kind), "arrowhead");
                pushAttribute(lAttrs, dotMappings.getArrow(pArc.kind), "arrowtail");
                pushAttribute(lAttrs, "both", "dir");
            }
            break;
        case ("nondirectional"):
            {
                pushAttribute(lAttrs, "none", "dir");
            }
            break;
        default: break;
        }

        if (!pArc.arcs) {
            lRetVal += renderEntityName(pArc.from) + " ";
            lRetVal += "--";
            lRetVal += " " + renderEntityName(pArc.to);
            lRetVal += renderAttributeBlock(lAttrs);
        }
        return lRetVal;
    }

    function renderSingleArc(pArc, pCounter, pIndent) {
        var lRetVal = "";
        var lAggregatedKind = aggregatekind.getAggregate(pArc.kind);

        if (lAggregatedKind === "box") {
            lRetVal += renderBoxArc(pArc, pCounter, pIndent);
        } else {
            lRetVal += renderRegularArc(pArc, lAggregatedKind, pCounter);
        }
        return lRetVal;
    }

    function renderArc(pArc, pIndent) {
        var lRetVal = "";

        if (pArc.from && pArc.kind && pArc.to) {
            lRetVal += INDENT + pIndent + renderSingleArc(pArc, ++gCounter, pIndent) + "\n";
            if (pArc.arcs) {
                lRetVal += INDENT + pIndent + "subgraph cluster_" + gCounter.toString() + '{';
                if (pArc.label) {
                    lRetVal +=
                        "\n" + INDENT + pIndent + ' label="' + pArc.kind + ": " + pArc.label + '" labeljust="l"\n';
                }
                lRetVal += renderArcLines(pArc.arcs, pIndent + INDENT);
                lRetVal += INDENT + pIndent + "}\n";
            }
        }
        return lRetVal;

    }

    function renderArcLines(pArcLines, pIndent) {
        return pArcLines.reduce(function(pPrevArcLine, pNextArcLine){
            return pPrevArcLine + pNextArcLine.reduce(function(pPrevArc, pNextArc){
                return pPrevArc + renderArc(pNextArc, pIndent);
            }, "");
        }, "");
    }

    return {
        render : function(pAST) {
            return _renderAST(flatten.dotFlatten(_.cloneDeep(pAST)));
        }
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
