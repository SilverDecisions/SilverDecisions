var lng = getParameterByName('lang') || 'en';

var data = {
    "SilverDecisions": "0.5.1",
    "lng": "en",
    "rule": "expected-value-maximization",
    "title": "Diagram title",
    "description": "Diagram description zażółć gęślą jaźń",
    "format": {
        "locales": "en",
        "payoff": {
            "style": "currency",
            "currency": "USD",
            "currencyDisplay": "symbol",
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
    "trees": [
        {
            "computed": {
                "expected-value-maximization": {
                    "childrenPayoff": "1 3704647/4042689",
                    "payoff": "1 3704647/4042689",
                    "optimal": true
                },
                "maxi-min": {
                    "childrenPayoff": "0",
                    "payoff": "0",
                    "optimal": true
                },
                "maxi-max": {
                    "childrenPayoff": "9",
                    "payoff": "9",
                    "optimal": true
                }
            },
            "childEdges": [
                {
                    "computed": {
                        "payoff": "-1",
                        "expected-value-maximization": {
                            "probability": 1,
                            "optimal": true
                        },
                        "maxi-min": {
                            "probability": 0,
                            "optimal": false
                        },
                        "maxi-max": {
                            "probability": 1,
                            "optimal": true
                        }
                    },
                    "name": "play",
                    "payoff": "-1",
                    "childNode": {
                        "computed": {
                            "expected-value-maximization": {
                                "childrenPayoff": "2 3704647/4042689",
                                "payoff": "1 3704647/4042689",
                                "optimal": true
                            },
                            "maxi-min": {
                                "childrenPayoff": "0",
                                "payoff": "-1"
                            },
                            "maxi-max": {
                                "childrenPayoff": "10",
                                "payoff": "9",
                                "optimal": true
                            }
                        },
                        "childEdges": [
                            {
                                "computed": {
                                    "probability": "2358005/8085378",
                                    "payoff": "10",
                                    "expected-value-maximization": {
                                        "probability": "2358005/8085378",
                                        "optimal": true
                                    },
                                    "maxi-min": {
                                        "probability": 0
                                    },
                                    "maxi-max": {
                                        "probability": 1,
                                        "optimal": true
                                    }
                                },
                                "name": "win",
                                "probability": "p",
                                "payoff": "10",
                                "childNode": {
                                    "computed": {
                                        "expected-value-maximization": {
                                            "aggregatedPayoff": "9",
                                            "probabilityToEnter": "2358005/8085378",
                                            "payoff": "10",
                                            "optimal": true
                                        },
                                        "maxi-min": {
                                            "aggregatedPayoff": "9",
                                            "probabilityToEnter": 0,
                                            "payoff": "10"
                                        },
                                        "maxi-max": {
                                            "aggregatedPayoff": "9",
                                            "probabilityToEnter": "1",
                                            "payoff": "10",
                                            "optimal": true
                                        }
                                    },
                                    "childEdges": [],
                                    "name": "",
                                    "code": "",
                                    "expressionScope": {
                                        "p": 0.291638189333878
                                    },
                                    "location": {
                                        "x": 320,
                                        "y": 20
                                    },
                                    "type": "terminal"
                                }
                            },
                            {
                                "computed": {
                                    "probability": "5727373/8085378",
                                    "payoff": "0",
                                    "expected-value-maximization": {
                                        "probability": "5727373/8085378",
                                        "optimal": true
                                    },
                                    "maxi-min": {
                                        "probability": 1
                                    },
                                    "maxi-max": {
                                        "probability": 0,
                                        "optimal": false
                                    }
                                },
                                "name": "lose",
                                "probability": "#",
                                "payoff": 0,
                                "childNode": {
                                    "computed": {
                                        "expected-value-maximization": {
                                            "aggregatedPayoff": "-1",
                                            "probabilityToEnter": "5727373/8085378",
                                            "payoff": "0",
                                            "optimal": true
                                        },
                                        "maxi-min": {
                                            "aggregatedPayoff": "-1",
                                            "probabilityToEnter": 0,
                                            "payoff": "0"
                                        },
                                        "maxi-max": {
                                            "aggregatedPayoff": "-1",
                                            "probabilityToEnter": 0,
                                            "payoff": "0"
                                        }
                                    },
                                    "childEdges": [],
                                    "name": "",
                                    "code": "",
                                    "expressionScope": {
                                        "p": 0.291638189333878
                                    },
                                    "location": {
                                        "x": 320,
                                        "y": 95
                                    },
                                    "type": "terminal"
                                }
                            }
                        ],
                        "name": "",
                        "code": "",
                        "expressionScope": {
                            "p": 0.291638189333878
                        },
                        "location": {
                            "x": 170,
                            "y": 57.5
                        },
                        "type": "chance"
                    }
                },
                {
                    "computed": {
                        "payoff": "0",
                        "expected-value-maximization": {
                            "probability": 0,
                            "optimal": false
                        },
                        "maxi-min": {
                            "probability": 1,
                            "optimal": true
                        },
                        "maxi-max": {
                            "probability": 0,
                            "optimal": false
                        }
                    },
                    "name": "leave",
                    "payoff": 0,
                    "childNode": {
                        "computed": {
                            "expected-value-maximization": {
                                "aggregatedPayoff": "0",
                                "probabilityToEnter": 0,
                                "payoff": "0"
                            },
                            "maxi-min": {
                                "aggregatedPayoff": "0",
                                "probabilityToEnter": "1",
                                "payoff": "0",
                                "optimal": true
                            },
                            "maxi-max": {
                                "aggregatedPayoff": "0",
                                "probabilityToEnter": 0,
                                "payoff": "0"
                            }
                        },
                        "childEdges": [],
                        "name": "",
                        "code": "",
                        "expressionScope": {
                            "p": 0.291638189333878
                        },
                        "location": {
                            "x": 170,
                            "y": 132.5
                        },
                        "type": "terminal"
                    }
                }
            ],
            "name": "game\ndilemma",
            "code": "",
            "expressionScope": {
                "p": 0.291638189333878
            },
            "location": {
                "x": 20,
                "y": 95
            },
            "type": "decision"
        }
    ],
    "texts": [],
    "expressionScope": {
        "p": 0.291638189333878
    },
    "code": "p = random(0,1)"
};
var app = new SilverDecisions('app-container', {
    lng: lng,
    readOnly: false,
    logLevel: 'trace',
    buttons:{
        new: true,
        save: true,
        open: true,
        exportToPng: true,
        exportToSvg: true,
    },
    showExport: true,
    showDetails: true,
    jsonFileDownload: true,
    treeDesigner:{
        description:{
            show: true
        }
    }
}, data);

document.addEventListener('SilverDecisionsSaveEvent', function(data){
    console.log(data);
});


function getParameterByName(name, url) {
    if (!url) {
        url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}
