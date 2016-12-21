var data = {
    "SilverDecisions": "0.2.0",
    "lng": "en",
    "rule": "expected-value-maximization",
    "title": 'Diagram title',
    "description": 'Diagram description zażółć gęślą jaźń',
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
                                "probability": "#",
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
            "name": "game\ndilemma",
            "location": {
                "x": 20,
                "y": 95
            },
            "type": "decision"
        }
    ]
};
var app = new SilverDecisions('app-container', {
    lng: 'en',
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
