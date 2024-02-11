function init() {

  myDiagram = new go.Diagram("quiz-container",
{
    // when a drag-drop occurs in the Diagram's background, make it a top-level node
    mouseDrop: e => finishDrop(e, null),
    layout:  // Diagram has horizontal layout with wrapping
        // new go.GridLayout(
        //     {
        //         wrappingColumn: Infinity,
        //         spacing: new go.Size(5, 5),  // optional: set spacing between nodes
        //         cellSize: new go.Size(1, 1),
        //         alignment: go.GridLayout.Position
        //     }),
        // new go.ForceDirectedLayout( {
        //     defaultSpringLength: 10,
        //     defaultElectricalCharge: 50,
        //     wrappingColumn: Infinity,
        //     spacing: new go.Size(1, 1),  // optional: set spacing between nodes
        //     cellSize: new go.Size(1, 1),
        //     randomNumberGenerator: null
        //   })
        // ,
        new go.TreeLayout(
          {
            angle: 90,
            arrangement: go.TreeLayout.ArrangementHorizontal,
            layerSpacing: 80,
            nodeSpacing: 30,
            layerStyle: go.TreeLayout.LayerUniform,
           
          }),
    "commandHandler.archetypeGroupData": { isGroup: true, text: "Group", horiz: false },
    "undoManager.isEnabled": true
});

  // The one template for Groups can be configured to be either layout out its members
  // horizontally or vertically, each with a different default color.
  function makeLayout(horiz) {  // a Binding conversion function
    if (horiz) {
      return new go.GridLayout(
        {
          wrappingWidth: Infinity, alignment: go.GridLayout.Position,
          cellSize: new go.Size(1, 1), spacing: new go.Size(4, 4)
        });
    } else {
      return new go.GridLayout(
        {
          wrappingColumn: 1, alignment: go.GridLayout.Position,
          cellSize: new go.Size(1, 1), spacing: new go.Size(4, 4)
        });
    }
  }

  function defaultColor(horiz) {  // a Binding conversion function
    return horiz ? "rgba(255, 221, 51, 0.55) " : "rgba(51,211,229, 0.5)";
  }

  function defaultFont(horiz) {  // a Binding conversion function
    return horiz ? "bold 20px sans-serif" : "bold 16px sans-serif";
  }

  // this function is used to highlight a Group that the selection may be dropped into
  function highlightGroup(e, grp, show) {
    if (!grp) return;
    e.handled = true;
    if (show) {
      // cannot depend on the grp.diagram.selection in the case of external drag-and-drops;
      // instead depend on the DraggingTool.draggedParts or .copiedParts
      var tool = grp.diagram.toolManager.draggingTool;
      var map = tool.draggedParts || tool.copiedParts;  // this is a Map
      // now we can check to see if the Group will accept membership of the dragged Parts
      if (grp.canAddMembers(map.toKeySet())) {
        grp.isHighlighted = true;
        return;
      }
    }
    grp.isHighlighted = false;
  }

  // Upon a drop onto a Group, we try to add the selection as members of the Group.
  // Upon a drop onto the background, or onto a top-level Node, make selection top-level.
  // If this is OK, we're done; otherwise we cancel the operation to rollback everything.
  function finishDrop(e, grp) {
    var ok = (grp !== null
      ? grp.addMembers(grp.diagram.selection, true)
      : e.diagram.commandHandler.addTopLevelParts(e.diagram.selection, true));
    if (!ok) e.diagram.currentTool.doCancel();
  }

  myDiagram.groupTemplate =
    new go.Group("Auto",
      {
        background: "blue",
        ungroupable: true,
        isSubGraphExpanded: false,
        // highlight when dragging into the Group
        mouseDragEnter: (e, grp, prev) => highlightGroup(e, grp, true),
        mouseDragLeave: (e, grp, next) => highlightGroup(e, grp, false),
        computesBoundsAfterDrag: true,
        computesBoundsIncludingLocation: true,
        // when the selection is dropped into a Group, add the selected Parts into that Group;
        // if it fails, cancel the tool, rolling back any changes
        mouseDrop: finishDrop,
        handlesDragDropForMembers: true,  // don't need to define handlers on member Nodes and Links
        // Groups containing Groups lay out their members horizontally
        layout: makeLayout(false)
      })
      .bind("layout", "horiz", makeLayout)
      .bind(new go.Binding("background", "isHighlighted", h => h ? "rgba(255,0,0,0.2)" : "transparent").ofObject())
      .add(new go.Shape("Rectangle",
        { fill: null, stroke: defaultColor(false), fill: defaultColor(false), strokeWidth: 2 })
        .bind("stroke", "horiz", defaultColor)
        .bind("fill", "horiz", defaultColor))
      .add(
        new go.Panel("Vertical")  // title above Placeholder
          .add(new go.Panel("Horizontal",  // button next to TextBlock
            { stretch: go.GraphObject.Horizontal, background: defaultColor(false) })
            .bind("background", "horiz", defaultColor)
            .add(go.GraphObject.make("SubGraphExpanderButton", { alignment: go.Spot.Right, margin: 5 }))
            .add(new go.TextBlock(
              {
                alignment: go.Spot.Left,
                editable: true,
                margin: 5,
                font: defaultFont(false),
                opacity: 0.95,  // allow some color to show through
                stroke: "#404040"
              })
              .bind("font", "horiz", defaultFont)
              .bind("text", "text", null, null)) // `null` as the fourth argument makes this a two-way binding
          )  // end Horizontal Panel
          .add(new go.Placeholder({ padding: 5, alignment: go.Spot.TopLeft })),
          // Anfasser für das Ziehen von Links
          go.GraphObject.make(go.Panel, "Horizontal",
            { 
              toMaxLinks: 1,
              alignmentFocus: go.Spot.Top,  // Der Anfasser bleibt am unteren Rand des Panels
              // Positionieren Sie den Anfasser relativ zur Größe des Nodes und zur Position des Standard-Links
              alignment: new go.Spot(0.5, 0 ),
              visible: true  
            },
            // Maximal ein Link pro Anfasser
            go.GraphObject.make(go.Shape, "Rectangle",
                {
                    fill: "Black", stroke: null , desiredSize: new go.Size(5, 5),
                    cursor: "pointer", // Cursor für den Anfasser
                    portId: "",  // Der Anfasser dient als Verbindungsport
                    fromLinkable: true, fromLinkableSelfNode: true, fromLinkableDuplicates: true,
                    toLinkable: true, toLinkableSelfNode: false, toLinkableDuplicates: true
                }
            )
          )
      );

     
  myDiagram.nodeTemplate =
    new go.Node("Auto",
      { // dropping on a Node is the same as dropping on its containing Group, even if it's top-level
        mouseDrop: (e, node) => finishDrop(e, node.containingGroup)
      })
      .add(new go.Shape("RoundedRectangle", { fill: "rgba(172, 230, 0, 0.9)", stroke: "white", strokeWidth: 0.5 }))
      .add(new go.TextBlock(
        {
          margin: 7,
          editable: true,
          font: "bold 13px sans-serif",
          opacity: 0.90
        })
        .bind("text", "text", null, null));  // `null` as the fourth argument makes this a two-way binding

  myDiagram.nodeTemplateMap.add("questionNode",
    go.GraphObject.make(go.Node, "Auto",
      { 
        click: function(e, node) {
          toggleAnswersVisibility(node);
          // Frieren Sie die Position des Knotens ein
          node.location = new go.Point(node.location.x, node.location.y);
        },
        locationSpot: go.Spot.Center
      },
      go.GraphObject.make(go.Shape, "RoundedRectangle", { fill: "lightgreen", stroke: "black" }), 
      go.GraphObject.make(go.TextBlock, { margin: 8 }, new go.Binding("text", "text")),
      
      // Anfasser für das Ziehen von Links
      go.GraphObject.make(go.Panel, "Horizontal",
        { 
          toMaxLinks: 1,
          alignmentFocus: go.Spot.Bottom,  // Der Anfasser bleibt am unteren Rand des Panels
          // Positionieren Sie den Anfasser relativ zur Größe des Nodes und zur Position des Standard-Links
          alignment: new go.Spot(0.5, 1.1 ),
          visible: true  
        },  // Maximal ein Link pro Anfasser
        go.GraphObject.make(go.Shape, "Rectangle",
          {
            fill: "Black", stroke: null , desiredSize: new go.Size(5, 5),
            cursor: "pointer", // Cursor für den Anfasser
            portId: "",  // Der Anfasser dient als Verbindungsport
            fromLinkable: true, fromLinkableSelfNode: true, fromLinkableDuplicates: true,
            toLinkable: true, toLinkableSelfNode: false, toLinkableDuplicates: true
          }
        )
      ),
      // Link-Validierungsfunktion, um das Zeichnen von Links zu unterbinden
      {
        linkValidation: function(fromnode, fromport, tonode, toport) {
          if (tonode && tonode.category === "questionNode") {
            return false;  // Verhindern Sie das Zeichnen von Links zu Nodes mit category "questionNode"
          }
          return true;
        }
      }
    )
  );
    

  myDiagram.linkTemplate =
    go.GraphObject.make(go.Link,
      {
          routing: go.Link.Normal,
          curve: go.Link.Bezier,
          corner: 10,
        selectable: false
      },
      go.GraphObject.make(go.Shape, { strokeWidth: 2, stroke: "black" })
    );
 
  // search a question-----------------
  document.addEventListener("DOMContentLoaded", function () {
    
    // Neues HTML-Element für die Autovervollständigungsliste
    const autoCompleteList = document.getElementById("autoCompleteList");
    function searchQuestion() {
      try {
        const searchingEl = document.getElementById("searchInput").value.toLowerCase();
        // console.log("Search term:", searchingEl);
    
        // Verwende das ursprüngliche nodeDataArray
        const filteredNodes = originalNodeDataArray.filter((element) => {
          const groupData = myDiagram.model.findNodeDataForKey(element.group);
          const parentGroupData = groupData ? myDiagram.model.findNodeDataForKey(groupData.group) : null;
    
          return (
            element.text.toLowerCase().includes(searchingEl) ||
            (groupData && groupData.text.toLowerCase().includes(searchingEl)) ||
            (parentGroupData && parentGroupData.text.toLowerCase().includes(searchingEl))
          );
        });
    
        myDiagram.startTransaction("scrollToNode");

        myDiagram.nodes.each(function (node) {
            const nodeData = node.data;
            const isFilteredNode = filteredNodes.some(filteredNode => filteredNode.key === nodeData.key);

            if (isFilteredNode) {
                // Zoom and scroll to the filtered node
                myDiagram.commandHandler.scrollToPart(node); // Scroll to the node
                node.scale = 1.3; // Zoom in on the node
            } else {
                node.scale = 1; // Reset scale for nodes that are not filtered
            }
        });

        myDiagram.commitTransaction("scrollToNode");
    
       
    
        // Zeige die Liste mit den Texten der gefilterten Nodes an
        updateAutoCompleteList(filteredNodes);
        // console.log("Filtered nodes:", myDiagram.model.nodeDataArray);
      } catch (error) {
        console.error("An error occurred:", error);
      }
    }
    
    

    // Funktion zum Aktualisieren der Autovervollständigungsliste
    function updateAutoCompleteList(filteredNodes) {
      const autoCompleteList = document.getElementById("autoCompleteList");
      autoCompleteList.innerHTML = "";
  
      // Füge die Texte der gefilterten Nodes zur Liste hinzu
      filteredNodes.forEach((node) => {
        const listItem = document.createElement("li");
        listItem.textContent = node.text;
        listItem.addEventListener("click", () => {
          // Fülle das Suchfeld mit dem ausgewählten Text
          document.getElementById("searchInput").value = node.text;
          // Führe die Suche erneut aus, um das Diagramm zu aktualisieren
          searchQuestion();
          hideAutoCompleteList();
        });
        autoCompleteList.appendChild(listItem);
      });
    }

    // Neue Funktion zum Verstecken der Autovervollständigungsliste
    function hideAutoCompleteList() {
      autoCompleteList.style.display = "none";
    }

    // Neue Funktion zum Anzeigen der Autovervollständigungsliste
    function showAutoCompleteList() {
      autoCompleteList.style.display = "block";
    }

    // Event Listener für das Input-Feld, um die Liste bei Eingabe anzuzeigen und zu aktualisieren
    document.getElementById('searchInput').addEventListener('input', (event) => {
      searchQuestion();
      // Zeige die Liste, wenn das Suchfeld nicht leer ist
      if (event.target.value !== "") {
        showAutoCompleteList();
      } else {
        // Verstecke die Liste, wenn das Suchfeld leer ist
        hideAutoCompleteList();
        myDiagram.nodes.each(function(node) {
          
          node.scale = 1;
          if (node.isGroup) {
            node.isSubGraphExpanded = false;
        }
          
        });
      }
    });
  
  });

  
  loadData();
}
// initiate the diagram
init();

//--------- Event-Handler für das contextmenu-Ereignis----------------

myDiagram.div.addEventListener('contextmenu', function (e) {
  e.preventDefault(); // Verhindert das Standardkontextmenü des Browsers
  showCustomContextMenu(e.pageX, e.pageY);
});

// Funktion zum Anzeigen des benutzerdefinierten Kontextmenüs
function showCustomContextMenu(x, y) {
  // Erstellen Sie ein HTML-Element für das benutzerdefinierte Kontextmenü
  var contextMenu = document.createElement('div');
  contextMenu.style.position = 'absolute';
  contextMenu.style.left = x + 'px';
  contextMenu.style.top = y + 'px';
  contextMenu.style.backgroundColor = '#333';
  contextMenu.style.color = '#fff';
  contextMenu.style.border = '1px solid #ccc';
  contextMenu.style.padding = '5px';
  contextMenu.style.zIndex = '1000';
  var style = document.createElement('style');
  style.textContent = `
    span:hover {
      background-color: #bb7474;
      color: #fff;
    }
  `;

  contextMenu.appendChild(style);
  // Fügen Sie Menüelemente hinzu (ersetzen Sie dies durch Ihre eigenen Aktionen)
  var copyMenuItem = document.createElement('span');
  copyMenuItem.style.display = 'block'; 
  
  copyMenuItem.textContent = 'Copy';
  copyMenuItem.addEventListener('click', function () {
    // Fügen Sie die Logik für die "Copy"-Aktion hinzu
    myDiagram.commandHandler.copySelection(); 
    //alert('Copy action');
    contextMenu.remove();
  });
  contextMenu.appendChild(copyMenuItem);

  var pasteMenuItem = document.createElement('span');
  pasteMenuItem.style.display = 'block'; 
  pasteMenuItem.textContent = 'Paste';
  pasteMenuItem.addEventListener('click', function () {
    // Fügen Sie die Logik für die "Paste"-Aktion hinzu
    var diagramPoint = myDiagram.lastInput.documentPoint;
    var pastePoint = new go.Point(diagramPoint.x , diagramPoint.y );
    
    // Deaktivieren Sie die automatische Anordnung
    myDiagram.layout.isOngoing = false;
    
    myDiagram.commandHandler.pasteSelection(pastePoint);
    
    // Aktivieren Sie die automatische Anordnung
    myDiagram.layout.isOngoing = true;
    
    //alert('Paste action');
    contextMenu.remove();
  });
  contextMenu.appendChild(pasteMenuItem);

  var undoMenuItem = document.createElement('span');
  undoMenuItem.style.display = 'block'; 
  undoMenuItem.textContent = 'Undo';
  undoMenuItem.addEventListener('click', function () {
    // Fügen Sie die Logik für die "Undo"-Aktion hinzu
    myDiagram.commandHandler.undo(); 
    //alert('Undo action');
    contextMenu.remove();
  });
  contextMenu.appendChild(undoMenuItem);

  var redoMenuItem = document.createElement('span');
  redoMenuItem.style.display = 'block'; 
  redoMenuItem.textContent = 'Redo';
  redoMenuItem.addEventListener('click', function () {
    // Fügen Sie die Logik für die "Redo"-Aktion hinzu
    myDiagram.commandHandler.redo();
   // alert('Redo action');
    contextMenu.remove();
  });
  contextMenu.appendChild(redoMenuItem);

  var duplicateMenuItem = document.createElement('span');
  duplicateMenuItem.style.display = 'block'; 
  duplicateMenuItem.textContent = 'Duplicate';
  duplicateMenuItem.addEventListener('click', function () {
    // Fügen Sie die Logik für die "Redo"-Aktion hinzu
    var diagramPoint = myDiagram.lastInput.documentPoint;
    var pastePoint = new go.Point(diagramPoint.x , diagramPoint.y );
    
    // Deaktivieren Sie die automatische Anordnung
    myDiagram.layout.isOngoing = false;
    
    myDiagram.commandHandler.copySelection();
    myDiagram.commandHandler.pasteSelection(pastePoint);
    
    // Aktivieren Sie die automatische Anordnung
    myDiagram.layout.isOngoing = true;
     
   // alert('Redo action');
    contextMenu.remove();
  });
  contextMenu.appendChild(duplicateMenuItem);
 
  var deleteMenuItem = document.createElement('span');
  deleteMenuItem.style.display = 'block'; 
  deleteMenuItem.textContent = 'Delete';
  deleteMenuItem.addEventListener('click', function() {
    // Hier den ausgewählten Knoten abrufen
    var selectedNode = myDiagram.selection.first();

    // Überprüfen, ob ein gültiges Teil (Element oder Verbindung) ausgewählt wurde  
    if (selectedNode instanceof go.Node) {
      // Zugriff auf die Daten des ausgewählten Knotens     
      var data = selectedNode.data;

      // Überprüfen Sie, ob das Datenobjekt einen "key" hat      
      if (data && data.key !== undefined) {

        // Hier haben Sie den "key" des ausgewählten Elements        
        var selectedKey = data.key;

        // console.log("Selected Key:", selectedKey);
        myDiagram.remove(selectedNode);
        deleteElementOnServer(selectedKey);

        // Fügen Sie hier Ihren Code für die Verwendung des "key" hinzu
      }
    }
    
   // alert('Redo action');
    contextMenu.remove();
  });
  contextMenu.appendChild(deleteMenuItem);
  
  // add new Question

  var addQuestion = document.createElement('span');
  addQuestion.style.display = 'block'; 
  addQuestion.textContent = 'add new question';
  addQuestion.addEventListener('click', function () {
    
    var newQuestionKey = "Question" + generateUniqueId();
    var answerKey = generateUniqueId(); 
    var subgroupKey= generateUniqueId();
    var anText="New Answer";
    var newNodeDataArray = [
      { key: newQuestionKey, text: "New Question", category: "questionNode" },
      { key: answerKey, text: anText, isGroup: true, group: newQuestionKey, visible: false, horiz: true },
      { key: subgroupKey, text: anText.substring(0, 12), isGroup: true, group: answerKey },
      { text: "correct: _", group: subgroupKey },
      { text: "points: 10", group: subgroupKey },
      { text: "percentage: 100", group: subgroupKey }
      
    ];
    var newLinkDataArray = [{ key: generateUniqueId(), from: newQuestionKey, to: answerKey }]
    
  
    // Fügen Sie das neue Node-Daten-Array zu quizData.nodeDataArray hinzu
    quizData.nodeDataArray = quizData.nodeDataArray.concat(newNodeDataArray);
    quizData.linkDataArray = quizData.linkDataArray.concat(newLinkDataArray);
    
    // Aktualisieren Sie das Diagramm mit den aktualisierten quizData
    myDiagram.model = go.Model.fromJson(quizData);

    contextMenu.remove();
  });
  contextMenu.appendChild(addQuestion);

   // add new Answer

   var addAnswer = document.createElement('span');
   addAnswer.style.display = 'block'; 
   addAnswer.textContent = 'add new Answer';
   addAnswer.addEventListener('click', function () {
     
     var answerKey = generateUniqueId(); // antwort id initialisieren, sie wird dann vom server gesetzt.
     var subgroupKey= generateUniqueId();
     var anText="New Answer";
     var newNodeDataArray = [
       { key: answerKey, text: anText, isGroup: true, visible: false, horiz: true },
       { key: subgroupKey, text: anText.substring(0, 12), isGroup: true, group: answerKey },
       { text: "correct: _", group: subgroupKey },
       { text: "points: 10", group: subgroupKey },
       { text: "percentage: 100", group: subgroupKey }
       
     ];

     var selectedNode = myDiagram.selection.first();

    if (selectedNode instanceof go.Node) {
      // Zugriff auf die Daten des ausgewählten Knotens     
      var data = selectedNode.data;

      // Überprüfen Sie, ob das Datenobjekt einen "key" hat      
      if (data && data.key !== undefined && data.category == "questionNode") {

        // Hier haben Sie den "key" des ausgewählten Elements        
        var selectedKey = data.key;
        var newLinkDataArray = [{ key: generateUniqueId(), from: selectedKey, to: answerKey }]
        quizData.linkDataArray = quizData.linkDataArray.concat(newLinkDataArray);

        // Fügen Sie hier Ihren Code für die Verwendung des "key" hinzu
      }
    }

    // Fügen Sie das neue Node-Daten-Array zu quizData.nodeDataArray hinzu
    quizData.nodeDataArray = quizData.nodeDataArray.concat(newNodeDataArray);
     
     
     // Aktualisieren Sie das Diagramm mit den aktualisierten quizData
     myDiagram.model = go.Model.fromJson(quizData);
 
       contextMenu.remove();
   });
   contextMenu.appendChild(addAnswer);
 

  // Fügen Sie das benutzerdefinierte Kontextmenü zum DOM hinzu
  document.body.appendChild(contextMenu);


  // Event-Handler zum Entfernen des Kontextmenüs beim Klicken außerhalb
  document.addEventListener('click', function (event) {
    if (!contextMenu.contains(event.target)) {
      contextMenu.remove();
    }
  });
}

// Funktion zum Aufrufen der Server-API zum Löschen des Elements
function deleteElementOnServer(elementId) {
  fetch('/api/deleteElement', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ elementId: elementId }),
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log(data); // Erfolg oder eine andere Antwort vom Server

      // Hier können Sie weitere Aktionen nach dem Löschen durchführen
    })
    .catch(error => {
      console.error('Error:', error);
    });
}

var quizData = { "nodeDataArray": [], "linkDataArray": [] };
// ..................................Load data to Diagramm..............................
function loadData() {
  fetch('/api/data')
    .then(response => response.json())
    .then(data => {
      // console.log(data);
      // console.log(JSON.stringify(data, null, 2));
      

      // var quizData = { "nodeDataArray": [], "linkDataArray": [] };
      quizData.nodeDataArray.push({ text: "lastID: " + data.lastID });
      var createdAnswersNode = [];

      
      const groupedAnswers = {};
      data.questions.forEach(question => {
        var questionKey = question.name +"#" + generateUniqueId();
        quizData.nodeDataArray.push({ key: questionKey, text: question.text, category: "questionNode" });

        question.answers.forEach(answer => {
          const key = `${answer.text}`;
          if (!groupedAnswers[key]) {
            groupedAnswers[key] = [];
          }

          groupedAnswers[key].push(answer);
        });

        question.answers.forEach(answer => {
          const groupKey = answer.text; // Hier verwenden wir den Text des Antwortobjekts als Gruppenschlüssel
          const group = groupedAnswers[groupKey];
          
          if (group && !createdAnswersNode.includes(groupKey) && groupedAnswers[answer.text].length==1) {
            group.forEach((element, index) => {
              var nodeId = element.id + "#"+ generateUniqueId();
              var subgroupKey = generateUniqueId();
              quizData.nodeDataArray.push({ key: nodeId, text: element.text, isGroup: true, group: questionKey, visible: true , horiz:true });
              quizData.nodeDataArray.push({ key: subgroupKey, text: element.text.substring(0, 12), isGroup: true, group: nodeId });
              quizData.nodeDataArray.push({ text: "Question: " + question.text.substring(0, 12), group: subgroupKey });
              quizData.nodeDataArray.push({ text: "correct: " + element.correct, group: subgroupKey, horiz:false });
              quizData.nodeDataArray.push({ text: "points: " + element.points, group: subgroupKey });
              quizData.nodeDataArray.push({ text: "percentage: " + element.percentage, group: subgroupKey });
              quizData.linkDataArray.push({ key: generateUniqueId(), from: questionKey, to: nodeId });
              
            });
            createdAnswersNode.push(groupKey);
          } else if (createdAnswersNode.includes(groupKey)) {
            // Hier wird die Sichtbarkeit auf true gesetzt und ein Link erstellt
            const existingNode = quizData.nodeDataArray.find(node => node.text === groupKey);
            if (existingNode && groupedAnswers[groupKey].length>1 ) {
              existingNode.visible = true; // Setze die Sichtbarkeit auf true
              group.slice(1).forEach((element, index) => {
                var subgroupKey = generateUniqueId();
                quizData.nodeDataArray.push({ key: subgroupKey, text: existingNode.text.substring(0, 12), isGroup: true, group: existingNode.key, horiz:false });
                quizData.nodeDataArray.push({ text: "Question: " + question.text.substring(0, 12), group: subgroupKey });
                quizData.nodeDataArray.push({ text: "correct:" + element.correct, group: subgroupKey });
                quizData.nodeDataArray.push({ text: "points: " + element.points, group: subgroupKey });
                quizData.nodeDataArray.push({ text: "percentage: " + element.percentage, group: subgroupKey });
                group.splice(index, 1);
              });

              quizData.linkDataArray.push({ key: generateUniqueId(), from: questionKey, to: existingNode.key });
            }
          }
        });
      });
      // console.log(JSON.stringify(groupedAnswers, null, 2));



      myDiagram.model = go.Model.fromJson(quizData);

      originalNodeDataArray = quizData.nodeDataArray.slice();

      myDiagram.nodes.each(function (node) {
        node.visible = node.data.visible !== undefined ? node.data.visible : true;
      });

      myDiagram.links.each(function (link) {
        link.visible = link.data.visible !== undefined ? link.data.visible : true;
      });
    })
    .catch(error => {
      console.error('Error loading data:', error.message);
    });
}

function generateUniqueId() {
  return Math.random();
}

function toggleAnswersVisibility(parentNode) {
  // console.log("clicked");
  // Überprüfen, ob findTreeChildrenNodes definiert ist
  if (parentNode.findTreeChildrenNodes) {
    // Iterieren Sie durch alle Kinder des Elternknotens
    parentNode.findTreeChildrenNodes().each(function(childNode) {
      // Überprüfen, ob childNode definiert ist und die visible-Eigenschaft hat
      if (childNode && 'visible' in childNode) {
        // Nur umschalten, wenn der Kindknoten nicht mit anderen Elternknoten verbunden ist
        if (childNode.findNodesInto().count === 1) {
          // Umschalten der Sichtbarkeit des Kindknotens
          childNode.visible = !childNode.visible;

          // Überprüfen, ob links definiert ist
          if (childNode.links) {
            // Iterieren Sie durch alle Verbindungen des Kindknotens
            childNode.links.each(function(link) {
              // Überprüfen, ob link definiert ist und die visible-Eigenschaft hat
              if (link && 'visible' in link) {
                // Umschalten der Sichtbarkeit der Verbindung zum Kindknoten
                link.visible = !link.visible;
              }
            });
          }
        }
      }
    });
  }
}





//..............................UPDATE JSON FILE..........................................
function updateData() {
  var Data = myDiagram.model.toJson();
  // console.log(Data);
  // myDiagram.isModified = false;
  var newQuizData = JSON.parse(Data);
  console.log(JSON.stringify(newQuizData, null, 2));
  const updatedData = {
    lastID: getLastID(), // Replace with the new lastID
    questions: [
      // Replace with the updated array of questions
      // ...
    ]
  };

  newQuizData.nodeDataArray.forEach(element => {
    if(element.category == "questionNode")
    {
      updatedData.questions.push({ "name": element.key.split('#')[0], "text":element.text ,"answers":[]});
    } 
    

  });

  // Extract answers for each question
  newQuizData.nodeDataArray.forEach(ansNode => {
    updatedData.questions.forEach(ques => {
      if (ansNode.group && typeof ansNode.group === 'string' && ansNode.group.includes(ques.name)) {
        const subAnsNode = newQuizData.nodeDataArray.find(subNode => subNode.group == ansNode.key);
        if (subAnsNode) {
          ques.answers.push({
           "id": parseInt(ansNode.key.split('#')[0]),
            "text": subAnsNode.text,
            "correct": subAnsNode.correct === "true", // Adjust based on your data structure
            "points": getPoints(ansNode.key),
            "percentage": getPercentage(ansNode.key)
          });
        }
      }
    })
  });


  function getPoints(group) {
      const match = newQuizData.nodeDataArray.find(node => node.group === group && node.text.includes("points"));
      return match ? parseInt(match.text.split(":")[1].trim()) : 0;
    }
  function getPercentage(group) {
    const match = newQuizData.nodeDataArray.find(node => node.group === group && node.text.includes("percentage"));
    return match ? parseInt(match.text.split(":")[1].trim()) : 0;
  }

  function getCorrect(group) {
    const match = newQuizData.nodeDataArray.find(node => node.group === group && node.text.includes("correct"));
    // return match.text.split(":")[1].trim();
    return /^true$/i.test(match.text.split(":")[1].trim());
  }
  function getLastID() {
    const match = newQuizData.nodeDataArray.find(node =>  node.text.includes("lastID"));
    return match ? parseInt(match.text.split(":")[1].trim()) : 0;
  }
  
  fetch('/api/updateAll', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updatedData)
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log(data); // Output success or any other response from the server

      // dialog Fenster
      const dialog = document.getElementById("dialog");

      // dialog.show();
      dialog.showModal();

      // Warte 10 Sekunden, bevor das Modal geschlossen wird
      setTimeout(function() {
          // Schließe das Modal nach 10 Sekunden
          dialog.close();
      }, 5000); // 10000 Millisekunden entsprechen 10 Sekunden
      
    })
    .catch(error => {
      console.error('Error:', error);
    });
}

//...............Add New question........................................................................................................................... 
document.addEventListener("DOMContentLoaded", function () {

  function setId() {
    return 0;
  }

  function populateAnswerSelect(data, answerSelect) {
    // answerSelect.name = 'answerSelect';
    // answerSelect.classList.add('answerSelect');
    answerSelect.innerHTML = '<option value="" disabled selected >Select an Answer</option>';
    data.questions.forEach(question => {
      question.answers.forEach(answer => {
        const option = document.createElement('option');
        option.value = answer.id;
        option.text = answer.text;
        answerSelect.appendChild(option);
      });
    });
  }

  function addAnswerRow(answersContainer) {
    const newRow = document.createElement("tbody");
    newRow.classList.add("answerRow");

    const answerSelect = document.createElement("select");
    populateAnswerSelect(data, answerSelect);

    const answerId = Math.random(); // Jede Antwortzeile erhält eine neue eindeutige ID
    newRow.innerHTML = `
      <tr>
        <td><label for="${answerId}_select">Select answer:</label></td>
        <td>${answerSelect.outerHTML}</td>
      </tr>
      <tr><td><label for="${answerId}_text">Answer Text:</label></td>
      <td><input type="text" id="${answerId}_text" class="ansText" name="ansText" required></td></tr>
      <tr><td><label for="${answerId}_points">Points:</label></td>
      <td><input type="number" id="${answerId}_points" class="ansPoints" name="ansPoints" required></td></tr>
      <tr><td><label for="${answerId}_correct">Correct:</label></td>
      <td><input type="checkbox" id="${answerId}_correct" class="ansCorrect" name="ansCorrect"></td></tr>
      <tr><td><label for="${answerId}_percentage">Percentage:</label></td>
      <td><input type="number" id="${answerId}_percentage" class="ansPercentage" name="ansPercentage" required></td></tr>
    `;

    answersContainer.appendChild(newRow);
  }

  function resetForm(answersContainer) {
    document.getElementById("questionName").value = "";
    document.getElementById("questionText").value = "";
    answersContainer.innerHTML = "";
  }
  
  window.resetForm = resetForm; // Die Funktion wird global zugänglich gemacht


  function submitForm(event) {
    event.preventDefault();

    const questionName = document.getElementById("questionName").value;
    const questionText = document.getElementById("questionText").value;

    const answers = [];
    document.querySelectorAll(".answerRow").forEach((row, index) => {
      const answerSelect = row.querySelector("select");
      const answerText = row.querySelector(".ansText").value;
      const answerPoints = parseInt(row.querySelector(".ansPoints").value);
      const answerCorrect = row.querySelector(".ansCorrect").checked;
      const answerPercentage = parseInt(row.querySelector(".ansPercentage").value);

      answers.push({
        id: setId(), // Nutze die aktualisierte setId-Funktion
        text: answerText,
        points: answerPoints,
        correct: answerCorrect,
        percentage: answerPercentage,
      });
    });

    const newData = {
      name: questionName,
      text: questionText,
      answers: answers,
    };

    fetch("/api/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newData),
    })
      .then((response) => response.json())
      .then((responseData) => {
        if (responseData.success) {
          loadData();
          resetForm(document.getElementById("answersContainer"));
        }
      })
      .catch(error => console.error('Error:', error));
  }

  const answersContainer = document.getElementById("answersContainer");

  document.getElementById("addAnswerBtn").addEventListener("click", () => {
    addAnswerRow(answersContainer);
  });

  document.getElementById("cancelAnswerBtn").addEventListener("click", function () {
    const answersContainer = document.getElementById("answersContainer");
    const lastAnswerRow = answersContainer.lastElementChild;
    if (lastAnswerRow) {
      answersContainer.removeChild(lastAnswerRow);
    }
  });

  fetch("/api/data")
    .then((response) => response.json())
    .then((responseData) => {
      data = responseData;
    });

  document.getElementById('answersContainer').addEventListener('input', (event) => {
    // Prüfen, ob das Event von einem select-Element ausgelöst wurde
    if (event.target.tagName.toLowerCase() === 'select') {
        const selectedAnswerId = parseInt(event.target.value);

        if (!isNaN(selectedAnswerId)) {
            const selectedQuestion = data.questions.find(question => 
                question.answers.some(answer => answer.id === selectedAnswerId)
            );

            if (selectedQuestion) {
                const selectedAnswer = selectedQuestion.answers.find(answer => answer.id === selectedAnswerId);

                const answerRow = event.target.closest('.answerRow');
                if (answerRow) {
                    answerRow.querySelector('.ansText').value = selectedAnswer.text;
                    answerRow.querySelector('.ansPoints').value = selectedAnswer.points;
                    answerRow.querySelector('.ansCorrect').checked = selectedAnswer.correct;
                    answerRow.querySelector('.ansPercentage').value = selectedAnswer.percentage;
                }
            }
        }
    }
  });
  document.getElementById("dataForm").addEventListener("submit", submitForm);
});

 // Scale 
 function scaleNode(node, scaleFactor) {
  // Stellen Sie sicher, dass der Node eine gültige Instanz ist
  if (node instanceof go.Node) {
    // Aktuelle Größe des Nodes abrufen
    var width = node.actualBounds.width;
    var height = node.actualBounds.height;

    // Neue Größe berechnen
    var newWidth = width * scaleFactor;
    var newHeight = height * scaleFactor;

    // Skalieren Sie den Node auf die neue Größe
    node.scale = new go.Spot(0.5, 0.5, newWidth / 2, newHeight / 2);
  }
}