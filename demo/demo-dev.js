var data = {
    "SilverDecisions": "0.2.0",
    "lng": "en",
    "rule": "expected-value-maximization",
    "title": 'Diagram title',
    "description": 'Diagram description',
    "format": {
        "locales": "en",
        "payoff": {
            "style": "currency",
            "currency": "USD",
            "minimumFractionDigits": 0,
            "maximumFractionDigits": 2,
            "useGrouping": true
        },
        "probability": {
            "style": "decimal",
            "minimumFractionDigits": 2,
            "maximumFractionDigits": 3,
            "useGrouping": true
        }
    },
    "treeDesigner": {
        "margin": {
            "left": 25,
            "right": 25,
            "top": 25,
            "bottom": 25
        },
        "layout": {
            "type": "tree",
            "nodeSize": 40,
            "limitNodePositioning": true,
            "gridHeight": 75,
            "gridWidth": 150,
            "edgeSlantWidthMax": 20
        },
        "fontFamily": "serif",
        "fontSize": "12px",
        "node": {
            "strokeWidth": "1px",
            "optimal": {
                "stroke": "#006f00",
                "strokeWidth": "1.5px"
            },
            "label": {
                "fontSize": "1em",
                "color": "back"
            },
            "payoff": {
                "fontSize": "1em",
                "color": "black",
                "negativeColor": "#b60000"
            },
            "decision": {
                "fill": "#ff7777",
                "stroke": "#660000",
                "selected": {
                    "fill": "#aa3333"
                }
            },
            "chance": {
                "fill": "#ffff44",
                "stroke": "#666600",
                "selected": {
                    "fill": "#aaaa00"
                }
            },
            "terminal": {
                "fill": "#44ff44",
                "stroke": "black",
                "selected": {
                    "fill": "#00aa00"
                },
                "payoff": {
                    "fontSize": "1em",
                    "color": "black",
                    "negativeColor": "#b60000"
                }
            }
        },
        "edge": {
            "stroke": "#424242",
            "strokeWidth": "1.5",
            "optimal": {
                "stroke": "#006f00",
                "strokeWidth": "2.4"
            },
            "selected": {
                "stroke": "#045ad1",
                "strokeWidth": "3.5"
            },
            "label": {
                "fontSize": "1em",
                "color": "back"
            },
            "payoff": {
                "fontSize": "1em",
                "color": "black",
                "negativeColor": "#b60000"
            }
        },
        "probability": {
            "fontSize": "1em",
            "color": "#0000d7"
        }
    },
    "trees": [
        {
            "computed": {
                "expected-value-maximization": {
                    "childrenPayoff": "0",
                    "payoff": "0",
                    "optimal": true
                }
            },
            "childEdges": [
                {
                    "computed": {
                        "expected-value-maximization": {
                            "probability": 0,
                            "optimal": false
                        }
                    },
                    "name": "play",
                    "payoff": "-1",
                    "childNode": {
                        "computed": {
                            "expected-value-maximization": {
                                "childrenPayoff": "1/10",
                                "payoff": "-9/10"
                            }
                        },
                        "childEdges": [
                            {
                                "computed": {
                                    "expected-value-maximization": {
                                        "probability": "1/100"
                                    }
                                },
                                "name": "win",
                                "probability": "0.01",
                                "payoff": "10",
                                "childNode": {
                                    "computed": {
                                        "expected-value-maximization": {
                                            "aggregatedPayoff": "9",
                                            "probabilityToEnter": 0,
                                            "payoff": "10"
                                        }
                                    },
                                    "childEdges": [],
                                    "name": "",
                                    "location": {
                                        "x": 320,
                                        "y": 20
                                    },
                                    "type": "terminal"
                                }
                            },
                            {
                                "computed": {
                                    "expected-value-maximization": {
                                        "probability": "99/100"
                                    }
                                },
                                "name": "lose",
                                "probability": "0.99",
                                "payoff": 0,
                                "childNode": {
                                    "computed": {
                                        "expected-value-maximization": {
                                            "aggregatedPayoff": "-1",
                                            "probabilityToEnter": 0,
                                            "payoff": "0"
                                        }
                                    },
                                    "childEdges": [],
                                    "name": "",
                                    "location": {
                                        "x": 320,
                                        "y": 95
                                    },
                                    "type": "terminal"
                                }
                            }
                        ],
                        "name": "",
                        "location": {
                            "x": 170,
                            "y": 57.5
                        },
                        "type": "chance"
                    }
                },
                {
                    "computed": {
                        "expected-value-maximization": {
                            "probability": 1,
                            "optimal": true
                        }
                    },
                    "name": "leave",
                    "payoff": 0,
                    "childNode": {
                        "computed": {
                            "expected-value-maximization": {
                                "aggregatedPayoff": "0",
                                "probabilityToEnter": "1",
                                "payoff": "0",
                                "optimal": true
                            }
                        },
                        "childEdges": [],
                        "name": "",
                        "location": {
                            "x": 170,
                            "y": 132.5
                        },
                        "type": "terminal"
                    }
                }
            ],
            "name": "dilemma",
            "location": {
                "x": 20,
                "y": 95
            },
            "type": "decision"
        }
    ]
};
var app = new SilverDecisions('app-container', {
    readOnly: false,
    buttons:{
        new: true,
        save: true,
        open: true,
        exportToPng: true,
        exportToSvg: true,
    },
    showExport: true,
    showDetails: true,
    jsonFileDownload: true
}, data);

document.addEventListener('SilverDecisionsSaveEvent', function(data){
    console.log(data);
});
