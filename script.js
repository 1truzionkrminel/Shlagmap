"use strict";


/* =========================================================
   SHLAGMAP
   Version avec sauvegarde Supabase
========================================================= */



/* =========================================================
   CONFIGURATION SUPABASE
========================================================= */

const SUPABASE_URL =
    "https://kmwakvbbvbwpsvzpbaxt.supabase.co";


const SUPABASE_KEY =
    "sb_publishable__7I38KT4dalY7qkFQTtWgw_WbscN1ih";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );



/* =========================================================
   CODE D'ACCES DU SITE
========================================================= */

const SITE_CODE =
    "18031871";



/* =========================================================
   ICONES DISPONIBLES
=========================================================

   Ces fichiers sont ceux que TU autorises.

   Personne ne peut ajouter d'icône
   depuis le site.

========================================================= */

const iconLibrary = [

    "icons/perso1.png",

    "icons/perso2.png",

    "icons/perso3.png",

    "icons/perso4.png",

    "icons/perso5.png",

    "icons/perso6.png",

    "icons/perso7.png",

    "icons/perso8.png"

];



/* =========================================================
   CATEGORIES PAR DEFAUT
========================================================= */

const defaultCategories = {

    "Auto-reduc": {

        name: "Auto-reduc",

        icon: "autoreduc.png",

        image: true,

        color: "#e63946"

    },


    "Batiment": {

        name: "Batiment",

        icon: "batiment.png",

        image: true,

        color: "#777777"

    },


    "Camera": {

        name: "Camera",

        icon: "camera.png",

        image: true,

        color: "#ff3333"

    },


    "Four": {

        name: "Four",

        icon: "four.png",

        image: true,

        color: "#ff8c00"

    },


    "Galerie": {

        name: "Galerie",

        icon: "galerie.png",

        image: true,

        color: "#9b59b6"

    },


    "Metro": {

        name: "Metro",

        icon: "metro.png",

        image: true,

        color: "#3498db"

    },


    "Recup": {

        name: "Recup",

        icon: "recup.png",

        image: true,

        color: "#2ecc71"

    },


    "Squat": {

        name: "Squat",

        icon: "squat.png",

        image: true,

        color: "#8e44ad"

    },


    "Toit": {

        name: "Toit",

        icon: "toit.png",

        image: true,

        color: "#f1c40f"

    }

};



/* =========================================================
   VARIABLES
========================================================= */

let map = null;

let pointLayer = null;

let lineLayer = null;


let categories = {};

let points = [];

let lines = [];


let selectedPosition = null;

let currentFilter = "ALL";

let currentMode = "point";


let drawing = false;

let currentLine = [];

let temporaryLine = null;


let selectedCategoryIcon =
    iconLibrary[0] || null;



/* =========================================================
   LOGIN
========================================================= */

const loginOverlay =
    document.getElementById(
        "loginOverlay"
    );


const accessCode =
    document.getElementById(
        "accessCode"
    );


const loginBtn =
    document.getElementById(
        "loginBtn"
    );


const loginError =
    document.getElementById(
        "loginError"
    );


loginBtn.addEventListener(
    "click",
    login
);


accessCode.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter"
        ) {

            login();

        }

    }
);



async function login() {

    if (
        accessCode.value !==
        SITE_CODE
    ) {

        loginError.textContent =
            "Code incorrect";

        accessCode.value = "";

        accessCode.focus();

        return;

    }


    loginError.textContent =
        "Chargement...";


    loginOverlay.style.display =
        "none";


    await initializeMap();

}



/* =========================================================
   CHARGEMENT CATEGORIES
========================================================= */

async function loadCategories() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("categories")
            .select("*");


    if (error) {

        console.error(
            "Erreur catégories :",
            error
        );

        throw error;

    }


    const result = {};


    data.forEach(
        category => {

            result[
                category.id
            ] = {

                name:
                    category.name,

                icon:
                    category.icon,

                image:
                    category.image,

                color:
                    category.color

            };

        }
    );


    return result;

}



/* =========================================================
   CHARGEMENT POINTS
========================================================= */

async function loadPoints() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("points")
            .select("*");


    if (error) {

        console.error(
            "Erreur points :",
            error
        );

        throw error;

    }


    return data.map(
        point => ({

            id:
                point.id,

            nom:
                point.name,

            description:
                point.description || "",

            categorie:
                point.category,

            lat:
                point.lat,

            lng:
                point.lng

        })
    );

}



/* =========================================================
   CHARGEMENT TRACES
========================================================= */

async function loadLines() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("lines")
            .select("*");


    if (error) {

        console.error(
            "Erreur tracés :",
            error
        );

        throw error;

    }


    return data.map(
        line => ({

            id:
                line.id,

            nom:
                line.name,

            description:
                line.description || "",

            categorie:
                line.category,

            coordinates:
                line.coordinates

        })
    );

}



/* =========================================================
   INITIALISATION
========================================================= */

async function initializeMap() {

    try {

        categories =
            await loadCategories();


        /*
         * Si la base est encore vide,
         * on crée les catégories par défaut.
         */

        if (
            Object.keys(categories)
                .length === 0
        ) {

            await createDefaultCategories();

            categories =
                await loadCategories();

        }


        points =
            await loadPoints();


        lines =
            await loadLines();


        /* CREATION CARTE */

        map =
            L.map("map")
                .setView(
                    [48.8566, 2.3522],
                    13
                );


        L.tileLayer(
            "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
            {

                maxZoom: 19,

                attribution:
                    "&copy; OpenStreetMap"

            }
        ).addTo(map);


        pointLayer =
            L.layerGroup()
                .addTo(map);


        lineLayer =
            L.layerGroup()
                .addTo(map);


        map.on(
            "click",
            handleMapClick
        );


        setupInterface();

        updateCategorySelects();

        buildFilters();

        render();


    }
    catch (error) {

        console.error(error);


        alert(
            "Impossible de charger les données de ShlagMap."
        );


        loginOverlay.style.display =
            "flex";

    }

}



/* =========================================================
   CREATION CATEGORIES PAR DEFAUT
========================================================= */

async function createDefaultCategories() {

    const data =
        Object.entries(
            defaultCategories
        )
            .map(
                ([id, category]) => ({

                    id: id,

                    name:
                        category.name,

                    icon:
                        category.icon,

                    image:
                        category.image,

                    color:
                        category.color

                })
            );


    const {
        error
    } =
        await supabaseClient
            .from("categories")
            .insert(data);


    if (error) {

        console.error(
            "Erreur catégories par défaut :",
            error
        );

        throw error;

    }

}



/* =========================================================
   INTERFACE
========================================================= */

function setupInterface() {

    document
        .getElementById("addBtn")
        .addEventListener(
            "click",
            addPoint
        );


    document
        .getElementById("pointModeBtn")
        .addEventListener(
            "click",
            () =>
                setMode("point")
        );


    document
        .getElementById("lineModeBtn")
        .addEventListener(
            "click",
            () =>
                setMode("line")
        );


    document
        .getElementById("startLineBtn")
        .addEventListener(
            "click",
            startDrawing
        );


    document
        .getElementById("finishLineBtn")
        .addEventListener(
            "click",
            finishDrawing
        );


    document
        .getElementById("cancelLineBtn")
        .addEventListener(
            "click",
            cancelDrawing
        );


    document
        .getElementById("newCategoryBtn")
        .addEventListener(
            "click",
            openCategoryModal
        );


    document
        .getElementById("closeCategoryModal")
        .addEventListener(
            "click",
            closeCategoryModal
        );


    document
        .getElementById("createCategoryBtn")
        .addEventListener(
            "click",
            createCategory
        );


    document
        .getElementById("closePanel")
        .addEventListener(
            "click",
            closePanel
        );


    document
        .getElementById("mobileMenuBtn")
        .addEventListener(
            "click",
            openPanel
        );


    document
        .getElementById("mobileAddBtn")
        .addEventListener(
            "click",
            openPanel
        );


    const colorInput =
        document.getElementById(
            "categoryColor"
        );


    colorInput.addEventListener(
        "input",
        () => {

            document.getElementById(
                "colorValue"
            ).textContent =
                colorInput.value;

        }
    );

}



/* =========================================================
   MODE
========================================================= */

function setMode(mode) {

    if (drawing) {

        cancelDrawing();

    }


    currentMode = mode;


    const pointButton =
        document.getElementById(
            "pointModeBtn"
        );


    const lineButton =
        document.getElementById(
            "lineModeBtn"
        );


    const pointForm =
        document.getElementById(
            "pointForm"
        );


    const lineForm =
        document.getElementById(
            "lineForm"
        );


    pointButton.classList.remove(
        "active"
    );


    lineButton.classList.remove(
        "active"
    );


    pointForm.classList.add(
        "hidden"
    );


    lineForm.classList.add(
        "hidden"
    );


    if (
        mode === "point"
    ) {

        pointButton.classList.add(
            "active"
        );


        pointForm.classList.remove(
            "hidden"
        );

    }
    else {

        lineButton.classList.add(
            "active"
        );


        lineForm.classList.remove(
            "hidden"
        );

    }

}



/* =========================================================
   CLIC CARTE
========================================================= */

function handleMapClick(event) {

    if (
        currentMode === "point"
    ) {

        selectedPosition =
            event.latlng;


        document.getElementById(
            "info"
        ).textContent =

            `${event.latlng.lat.toFixed(5)} , ` +

            `${event.latlng.lng.toFixed(5)}`;

        return;

    }


    if (
        currentMode === "line" &&
        drawing
    ) {

        currentLine.push([

            event.latlng.lat,

            event.latlng.lng

        ]);


        updateTemporaryLine();


        document.getElementById(
            "lineInfo"
        ).textContent =

            `${currentLine.length} point(s)`;

    }

}



/* =========================================================
   AJOUT POINT
========================================================= */

async function addPoint() {

    if (!selectedPosition) {

        alert(
            "Clique d'abord sur la carte."
        );

        return;

    }


    const name =
        document
            .getElementById("name")
            .value
            .trim();


    const description =
        document
            .getElementById("desc")
            .value
            .trim();


    const category =
        document
            .getElementById("category")
            .value;


    if (!name) {

        alert(
            "Donne un nom au point."
        );

        return;

    }


    const point = {

        id:
            Date.now(),

        name:
            name,

        description:
            description,

        category:
            category,

        lat:
            selectedPosition.lat,

        lng:
            selectedPosition.lng

    };


    const {
        error
    } =
        await supabaseClient
            .from("points")
            .insert(point);


    if (error) {

        console.error(error);

        alert(
            "Erreur lors de l'enregistrement du point."
        );

        return;

    }


    points.push({

        id:
            point.id,

        nom:
            point.name,

        description:
            point.description,

        categorie:
            point.category,

        lat:
            point.lat,

        lng:
            point.lng

    });


    render();


    document.getElementById(
        "name"
    ).value = "";


    document.getElementById(
        "desc"
    ).value = "";


    selectedPosition = null;


    document.getElementById(
        "info"
    ).textContent =
        "Point enregistré en ligne.";

}



/* =========================================================
   TRACES
========================================================= */

function startDrawing() {

    drawing = true;

    currentLine = [];


    document
        .getElementById(
            "startLineBtn"
        )
        .classList.add(
            "hidden"
        );


    document
        .getElementById(
            "finishLineBtn"
        )
        .classList.remove(
            "hidden"
        );


    document
        .getElementById(
            "cancelLineBtn"
        )
        .classList.remove(
            "hidden"
        );


    document.getElementById(
        "lineInfo"
    ).textContent =
        "Clique sur la carte pour tracer.";

}



function updateTemporaryLine() {

    if (temporaryLine) {

        lineLayer.removeLayer(
            temporaryLine
        );

    }


    if (
        currentLine.length < 2
    ) {

        temporaryLine = null;

        return;

    }


    temporaryLine =
        L.polyline(

            currentLine,

            {

                color:
                    "#ffffff",

                weight:
                    5,

                opacity:
                    0.8,

                dashArray:
                    "10 8"

            }

        );


    temporaryLine.addTo(
        lineLayer
    );

}



async function finishDrawing() {

    if (
        currentLine.length < 2
    ) {

        alert(
            "Il faut au moins 2 points."
        );

        return;

    }


    const name =
        document
            .getElementById(
                "lineName"
            )
            .value
            .trim();


    const description =
        document
            .getElementById(
                "lineDesc"
            )
            .value
            .trim();


    const category =
        document
            .getElementById(
                "lineCategory"
            )
            .value;


    if (!name) {

        alert(
            "Donne un nom au tracé."
        );

        return;

    }


    const newLine = {

        id:
            Date.now(),

        name:
            name,

        description:
            description,

        category:
            category,

        coordinates:
            currentLine

    };


    const {
        error
    } =
        await supabaseClient
            .from("lines")
            .insert(newLine);


    if (error) {

        console.error(error);

        alert(
            "Impossible d'enregistrer le tracé."
        );

        return;

    }


    lines.push({

        id:
            newLine.id,

        nom:
            newLine.name,

        description:
            newLine.description,

        categorie:
            newLine.category,

        coordinates:
            newLine.coordinates

    });


    cancelDrawing();

    render();


    document.getElementById(
        "lineName"
    ).value = "";


    document.getElementById(
        "lineDesc"
    ).value = "";


    document.getElementById(
        "lineInfo"
    ).textContent =
        "Tracé enregistré en ligne.";

}



function cancelDrawing() {

    drawing = false;

    currentLine = [];


    if (temporaryLine) {

        lineLayer.removeLayer(
            temporaryLine
        );

        temporaryLine = null;

    }


    document
        .getElementById(
            "startLineBtn"
        )
        .classList.remove(
            "hidden"
        );


    document
        .getElementById(
            "finishLineBtn"
        )
        .classList.add(
            "hidden"
        );


    document
        .getElementById(
            "cancelLineBtn"
        )
        .classList.add(
            "hidden"
        );


    document.getElementById(
        "lineInfo"
    ).textContent =
        "Clique sur « Commencer le tracé ».";

}



/* =========================================================
   RENDU
========================================================= */

function render() {

    pointLayer.clearLayers();

    lineLayer.clearLayers();



    /* POINTS */

    points.forEach(
        point => {

            if (
                currentFilter !== "ALL" &&
                point.categorie !==
                currentFilter
            ) {

                return;

            }


            const category =
                categories[
                point.categorie
                ];


            if (!category) {

                return;

            }


            const icon =
                L.icon({

                    iconUrl:
                        category.image
                            ? "icons/" +
                            category.icon
                            : category.icon,

                    iconSize:
                        [32, 32],

                    iconAnchor:
                        [16, 16],

                    popupAnchor:
                        [0, -16]

                });


            const marker =
                L.marker(

                    [
                        point.lat,
                        point.lng
                    ],

                    {
                        icon:
                            icon
                    }

                );


            marker.bindPopup(`

                <div class="popup">

                    <h3>
                        ${escapeHTML(
                point.nom
            )}
                    </h3>

                    <p>
                        ${escapeHTML(
                point.description
            )}
                    </p>

                    <small>
                        ${escapeHTML(
                point.categorie
            )}
                    </small>

                    <br><br>

                    <button
                        class="deletePopup"
                        onclick="deletePoint(${point.id})"
                    >
                        Supprimer
                    </button>

                </div>

            `);


            pointLayer.addLayer(
                marker
            );

        }
    );



    /* TRACES */

    lines.forEach(
        line => {

            if (
                currentFilter !== "ALL" &&
                line.categorie !==
                currentFilter
            ) {

                return;

            }


            const category =
                categories[
                line.categorie
                ];


            const lineColor =
                category?.color ||
                "#ff3333";


            const polyline =
                L.polyline(

                    line.coordinates,

                    {

                        color:
                            lineColor,

                        weight:
                            5,

                        opacity:
                            0.9,

                        lineCap:
                            "round",

                        lineJoin:
                            "round"

                    }

                );


            polyline.bindPopup(`

                <div class="popup">

                    <h3>
                        ${escapeHTML(
                line.nom
            )}
                    </h3>

                    <p>
                        ${escapeHTML(
                line.description
            )}
                    </p>

                    <small>
                        ${escapeHTML(
                line.categorie
            )}
                    </small>

                    <br><br>

                    <button
                        class="deletePopup"
                        onclick="deleteLine(${line.id})"
                    >
                        Supprimer
                    </button>

                </div>

            `);


            lineLayer.addLayer(
                polyline
            );

        }
    );

}



/* =========================================================
   SUPPRIMER POINT
========================================================= */

window.deletePoint =
    async function (id) {

        if (
            !confirm(
                "Supprimer ce point ?"
            )
        ) {

            return;

        }


        const {
            error
        } =
            await supabaseClient
                .from("points")
                .delete()
                .eq("id", id);


        if (error) {

            console.error(error);

            alert(
                "Impossible de supprimer le point."
            );

            return;

        }


        points =
            points.filter(
                point =>
                    point.id !== id
            );


        render();

    };



/* =========================================================
   SUPPRIMER TRACE
========================================================= */

window.deleteLine =
    async function (id) {

        if (
            !confirm(
                "Supprimer ce tracé ?"
            )
        ) {

            return;

        }


        const {
            error
        } =
            await supabaseClient
                .from("lines")
                .delete()
                .eq("id", id);


        if (error) {

            console.error(error);

            alert(
                "Impossible de supprimer le tracé."
            );

            return;

        }


        lines =
            lines.filter(
                line =>
                    line.id !== id
            );


        render();

    };



/* =========================================================
   FILTRES
========================================================= */

function buildFilters() {

    const container =
        document.getElementById(
            "headerFilters"
        );


    container.innerHTML = "";


    /* TOUS */

    const allButton =
        document.createElement(
            "button"
        );


    allButton.className =
        "filterButton";


    allButton.dataset.filter =
        "ALL";


    allButton.textContent =
        "🌐";


    allButton.title =
        "Tous";


    allButton.onclick =
        () => {

            currentFilter =
                "ALL";

            render();

            updateActiveFilter();

        };


    container.appendChild(
        allButton
    );



    /* CATEGORIES */

    Object.entries(categories)
        .forEach(
            ([id, category]) => {

                const button =
                    document.createElement(
                        "button"
                    );


                button.className =
                    "filterButton";


                button.dataset.filter =
                    id;


                button.title =
                    category.name;


                const image =
                    document.createElement(
                        "img"
                    );


                image.src =
                    category.image
                        ? "icons/" +
                        category.icon
                        : category.icon;


                image.alt =
                    category.name;


                button.appendChild(
                    image
                );


                button.onclick =
                    () => {

                        currentFilter =
                            id;

                        render();

                        updateActiveFilter();

                    };


                container.appendChild(
                    button
                );

            }
        );


    updateActiveFilter();

}



function updateActiveFilter() {

    document
        .querySelectorAll(
            ".filterButton"
        )
        .forEach(
            button => {

                button.classList.toggle(

                    "active",

                    button.dataset.filter ===
                    currentFilter

                );

            }
        );

}



/* =========================================================
   SELECT CATEGORIES
========================================================= */

function updateCategorySelects() {

    const selects = [

        document.getElementById(
            "category"
        ),

        document.getElementById(
            "lineCategory"
        )

    ];


    selects.forEach(
        select => {

            select.innerHTML = "";


            Object.entries(categories)
                .forEach(
                    ([id, category]) => {

                        const option =
                            document.createElement(
                                "option"
                            );


                        option.value =
                            id;


                        option.textContent =
                            category.name;


                        select.appendChild(
                            option
                        );

                    }
                );

        }
    );

}



/* =========================================================
   CREATION CATEGORIE
========================================================= */

async function createCategory() {

    const name =
        document
            .getElementById(
                "newCategoryName"
            )
            .value
            .trim();


    const color =
        document
            .getElementById(
                "categoryColor"
            )
            .value;


    const error =
        document.getElementById(
            "categoryError"
        );


    if (!name) {

        error.textContent =
            "Entre un nom.";

        return;

    }


    if (categories[name]) {

        error.textContent =
            "Cette catégorie existe déjà.";

        return;

    }


    if (!selectedCategoryIcon) {

        error.textContent =
            "Choisis une icône.";

        return;

    }


    const category = {

        id:
            name,

        name:
            name,

        icon:
            selectedCategoryIcon,

        image:
            false,

        color:
            color

    };


    const {
        error: databaseError
    } =
        await supabaseClient
            .from("categories")
            .insert(category);


    if (databaseError) {

        console.error(
            databaseError
        );

        error.textContent =
            "Erreur lors de la création.";

        return;

    }


    categories[name] = {

        name:
            name,

        icon:
            selectedCategoryIcon,

        image:
            false,

        color:
            color

    };


    updateCategorySelects();

    buildFilters();

    renderCategoryManager();

    render();


    document.getElementById(
        "newCategoryName"
    ).value = "";


    error.textContent =
        "Catégorie créée !";

}



/* =========================================================
   MODAL
========================================================= */

function openCategoryModal() {

    document
        .getElementById(
            "categoryModal"
        )
        .classList.add(
            "show"
        );


    selectedCategoryIcon =
        iconLibrary[0] || null;


    document.getElementById(
        "newCategoryName"
    ).value = "";


    document.getElementById(
        "categoryError"
    ).textContent = "";


    document.getElementById(
        "categoryColor"
    ).value =
        "#ff3333";


    document.getElementById(
        "colorValue"
    ).textContent =
        "#ff3333";


    buildIconLibrary();

    renderCategoryManager();

}



function closeCategoryModal() {

    document
        .getElementById(
            "categoryModal"
        )
        .classList.remove(
            "show"
        );

}



/* =========================================================
   ICONES
========================================================= */

function buildIconLibrary() {

    const container =
        document.getElementById(
            "iconLibrary"
        );


    container.innerHTML = "";


    iconLibrary.forEach(
        icon => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "iconChoice";


            if (
                icon ===
                selectedCategoryIcon
            ) {

                button.classList.add(
                    "selected"
                );

            }


            const image =
                document.createElement(
                    "img"
                );


            image.src =
                icon;


            image.alt =
                "Icône";


            button.appendChild(
                image
            );


            button.onclick =
                () => {

                    selectedCategoryIcon =
                        icon;


                    document
                        .querySelectorAll(
                            ".iconChoice"
                        )
                        .forEach(
                            element =>
                                element.classList
                                    .remove(
                                        "selected"
                                    )
                        );


                    button.classList.add(
                        "selected"
                    );


                    updateIconPreview();

                };


            container.appendChild(
                button
            );

        }
    );


    updateIconPreview();

}



function updateIconPreview() {

    const preview =
        document.getElementById(
            "selectedIconPreview"
        );


    preview.innerHTML = "";


    if (
        !selectedCategoryIcon
    ) {

        return;

    }


    const image =
        document.createElement(
            "img"
        );


    image.src =
        selectedCategoryIcon;


    preview.appendChild(
        image
    );

}



/* =========================================================
   GESTION CATEGORIES
========================================================= */

function renderCategoryManager() {

    const container =
        document.getElementById(
            "categoryManager"
        );


    container.innerHTML = "";


    Object.entries(categories)
        .forEach(
            ([id, category]) => {

                const row =
                    document.createElement(
                        "div"
                    );


                row.className =
                    "categoryRow";


                const iconContainer =
                    document.createElement(
                        "div"
                    );


                iconContainer.className =
                    "categoryManagerIcon";


                const image =
                    document.createElement(
                        "img"
                    );


                image.src =
                    category.image
                        ? "icons/" +
                        category.icon
                        : category.icon;


                iconContainer.appendChild(
                    image
                );


                const name =
                    document.createElement(
                        "span"
                    );


                name.textContent =
                    category.name;


                const color =
                    document.createElement(
                        "div"
                    );


                color.className =
                    "categoryColorPreview";


                color.style.background =
                    category.color;


                const deleteButton =
                    document.createElement(
                        "button"
                    );


                deleteButton.className =
                    "deleteCategoryBtn";


                deleteButton.textContent =
                    "🗑️";


                deleteButton.onclick =
                    () =>
                        deleteCategory(id);


                row.appendChild(
                    iconContainer
                );


                row.appendChild(
                    name
                );


                row.appendChild(
                    color
                );


                row.appendChild(
                    deleteButton
                );


                container.appendChild(
                    row
                );

            }
        );

}



/* =========================================================
   SUPPRESSION CATEGORIE
========================================================= */

async function deleteCategory(id) {

    const category =
        categories[id];


    if (!category) {

        return;

    }


    if (
        !confirm(
            `Supprimer "${category.name}" ?`
        )
    ) {

        return;

    }


    const {
        error
    } =
        await supabaseClient
            .from("categories")
            .delete()
            .eq("id", id);


    if (error) {

        console.error(error);

        alert(
            "Impossible de supprimer la catégorie."
        );

        return;

    }


    delete categories[id];


    if (
        currentFilter === id
    ) {

        currentFilter =
            "ALL";

    }


    updateCategorySelects();

    buildFilters();

    renderCategoryManager();

    render();

}



/* =========================================================
   MOBILE
========================================================= */

function openPanel() {

    document
        .getElementById(
            "controlPanel"
        )
        .classList.add(
            "mobileOpen"
        );

}



function closePanel() {

    document
        .getElementById(
            "controlPanel"
        )
        .classList.remove(
            "mobileOpen"
        );

}



/* =========================================================
   SECURITE HTML
========================================================= */

function escapeHTML(value) {

    return String(
        value || ""
    )

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}