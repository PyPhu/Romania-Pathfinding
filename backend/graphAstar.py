graph = {
    # =========================
    # Group A - West
    # =========================

    "Arad": {
        "Zerind": 75,
        "Sibiu": 140,
        "Timisoara": 118,
    },

    "Zerind": {
        "Arad": 75,
        "Oradea": 71,
    },

    "Oradea": {
        "Zerind": 71,
        "Sibiu": 151,
    },

    "Timisoara": {
        "Arad": 118,
        "Lugoj": 111,
    },


    # =========================
    # Group B - Southwest
    # =========================

    "Lugoj": {
        "Timisoara": 111,
        "Mehadia": 70,
    },

    "Mehadia": {
        "Lugoj": 70,
        "Drobeta": 75,
    },

    "Drobeta": {
        "Mehadia": 75,
        "Craiova": 120,
    },

    "Craiova": {
        "Drobeta": 120,
        "Rimnicu Vilcea": 146,
        "Pitesti": 138,
    },


    # =========================
    # Group C - Central
    # =========================

    "Sibiu": {
        "Arad": 140,
        "Oradea": 151,
        "Fagaras": 99,
        "Rimnicu Vilcea": 80,
    },

    "Rimnicu Vilcea": {
        "Sibiu": 80,
        "Craiova": 146,
        "Pitesti": 97,
    },

    "Fagaras": {
        "Sibiu": 99,
        "Bucharest": 211,
    },

    "Pitesti": {
        "Rimnicu Vilcea": 97,
        "Craiova": 138,
        "Bucharest": 101,
    },


    # =========================
    # Group D - South
    # =========================

    "Bucharest": {
        "Fagaras": 211,
        "Pitesti": 101,
        "Giurgiu": 90,
        "Urziceni": 85,
    },

    "Giurgiu": {
        "Bucharest": 90,
    },

    "Urziceni": {
        "Bucharest": 85,
        "Hirsova": 98,
        "Vaslui": 142,
    },

    "Hirsova": {
        "Urziceni": 98,
        "Eforie": 86,
    },

    "Eforie": {
        "Hirsova": 86,
    },


    # =========================
    # Group E - East
    # =========================

    "Vaslui": {
        "Urziceni": 142,
        "Iasi": 92,
    },

    "Iasi": {
        "Vaslui": 92,
        "Neamt": 87,
    },

    "Neamt": {
        "Iasi": 87,
    },
}

heuristic = {
    "Arad": 366,
    "Bucharest": 0,
    "Craiova": 160,
    "Drobeta": 242,
    "Eforie": 161,
    "Fagaras": 176,
    "Giurgiu": 77,
    "Hirsova": 151,
    "Iasi": 226,
    "Lugoj": 244,
    "Mehadia": 241,
    "Neamt": 234,
    "Oradea": 380,
    "Pitesti": 100,
    "Rimnicu Vilcea": 193,
    "Sibiu": 253,
    "Timisoara": 329,
    "Urziceni": 80,
    "Vaslui": 199,
    "Zerind": 374,
}

groups = {

    "A": {
        "name": "West",
        "cities": [
            "Arad",
            "Zerind",
            "Oradea",
            "Timisoara"
        ]
    },

    "B": {
        "name": "Southwest",
        "cities": [
            "Lugoj",
            "Mehadia",
            "Drobeta",
            "Craiova"
        ]
    },

    "C": {
        "name": "Central",
        "cities": [
            "Sibiu",
            "Rimnicu Vilcea",
            "Fagaras",
            "Pitesti"
        ]
    },

    "D": {
        "name": "South",
        "cities": [
            "Bucharest",
            "Giurgiu",
            "Urziceni",
            "Hirsova",
            "Eforie"
        ]
    },

    "E": {
        "name": "East",
        "cities": [
            "Vaslui",
            "Iasi",
            "Neamt",
           
        ]
    }
}

city_to_group = {
    "Arad": "A",
    "Zerind": "A",
    "Oradea": "A",
    "Timisoara": "A",

    "Lugoj": "B",
    "Mehadia": "B",
    "Drobeta": "B",
    "Craiova": "B",

    "Sibiu": "C",
    "Rimnicu Vilcea": "C",
    "Fagaras": "C",
    "Pitesti": "C",

    "Bucharest": "D",
    "Giurgiu": "D",
    "Urziceni": "D",
    "Hirsova": "D",

    "Vaslui": "E",
    "Iasi": "E",
    "Neamt": "E",
    "Eforie": "E"
}

group_edges = {
    "A": {
        "B": [
            ("Timisoara", "Lugoj", 111)
        ],
        "C": [
            ("Arad", "Sibiu", 140),
            ("Oradea", "Sibiu", 151),
        ]
    },

    "B": {
        "A": [
            ("Lugoj", "Timisoara", 111)
        ],
        "C": [
            ("Craiova", "Rimnicu Vilcea", 146),
            ("Craiova", "Pitesti", 138),
        ]
    },

    "C": {
        "A": [
            ("Sibiu", "Arad", 140),
            ("Sibiu", "Oradea", 151),
        ],
        "B": [
            ("Rimnicu Vilcea", "Craiova", 146),
            ("Pitesti", "Craiova", 138),
        ],
        "D": [
            ("Fagaras", "Bucharest", 211),
            ("Pitesti", "Bucharest", 101),
        ]
    },

    "D": {
        "C": [
            ("Bucharest", "Fagaras", 211),
            ("Bucharest", "Pitesti", 101),
        ],
        "E": [
            ("Urziceni", "Vaslui", 142)
        ]
    },

    "E": {
        "D": [
            ("Vaslui", "Urziceni", 142)
        ]
    }
}