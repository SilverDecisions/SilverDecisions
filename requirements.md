#Requirements for GUI of SilverDecisions

- Application has to be developed in web technologies with guaranteed long time maintenance and good availability of developers
- Application must run in major web browsers (Chrome, Firefox, Internet Explorer)
- Data model (preferably JSON or exportable to JSON) separated from visualization engine
- Actions available in GUI
    * change metadata (graphical and computational, eg. which objective function should be used for selection of the best path in a tree - payoffs for all algorithms should be internally computed but only one should be shown corresponding to the metadata)
    * undo/redo
    * autolayout
    * manual layout (moving a node moves also subtree)
    * export the tree representation to vector and raster graphics (and optionally PDF)
    * delete node (along with its subtree)
    * ability to select a subtree and copy them to another part of the tree
    * ability to move a subtree to another part of the tree
    * save/load tree from file (local or in the cloud)
    * add new node (decision, chance or final) as a sibling of an existing chance or decision node; corner case is an empty tree (in general it is OK that only one tree is allow in canvas, current Silverlight GUI allows many, but it is not required)
    * change parameters of a node
    * change parameters of edge
- recomputation of the tree should be automatic (on-line, this means in particular that error must be signaled in some way when the tree is not feasible)
- GUI does not have to have the same way of building trees as existing Silverlight GUI
- Every action in GUI changes the data model; the old data model is saved for undo/redo (it is OK and enough to save full model at each edit step, undo history of 4 last modifications is sufficient if it makes a difference in implementation)
- Some way to safeguard against losing work when accidentally browsing is performed (a confirmation message when trying to leave the page)
- Application checks whether the data and tree structure is valid (e.g. probabilities should sum up to 1.0 and cannot be negative)
- System must take into account ties (Two different decisions can have the same expected value or other outcome measure); this requires usage of high precision arithmetic
- Data model, preferably in JSON, has the following minimal information that can be extended in the future without modification of the general structure (structured so that e.g. it is simple to filter out only tree definition data - without graphical data and computation results)
    * model metadata
        - algorithmic options (which optimization algorithm is used for visualization - initially expected value maximization only (other plausible are maxi-min etc.), possibly state of computations if computations are time consuming)
        - visualization options (eg. font, number formatting, color skins etc.)
    * tree data; each element (node, edge) has three types of information
        - element definition
        - graphical attributes (like location etc.)
        - computation results
    * the following information is collected for the types of elements
        - decision node
            * definition: name, list of edges going out (this can be also defined as child nodes - dependng on preffered data structure)
            * graphical: location
            * computation: computed payoff for all available algorithms
        - chance node
            * definition: name, list of edges going out (or child nodes)
            * graphical: location
            * computation: computed payoff for all available algorithms
        - terminal node
            * definition: name
            * graphical: location
            * computation: aggregated payoff along path (this is always a sum along the path)
        - edge going out of decision node
            * definition: payoff if this path is taken
            * graphical: none
            * computation: 1/0 if this path is taken in optimal decision under the selected payoff calculation algorithm (this should be reflected graphically)
        - edge going out of chance node
            * definition: name, probability, payoff if this path is taken
            * graphical: none
            * computation: none

