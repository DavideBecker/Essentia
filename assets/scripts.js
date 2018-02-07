var tag
var cartItems = {}
var products = {}
var totalPrice = 0
var checkoutReady = false

var brands = ["Alpro", "Coca-Cola", "Ferrero", "Nestle", "Veggy Life", "Rewe Beste Wahl", "Ja!", "Kölln", "Barilla", "Schwälbchen", "Naturalis", "Maggi", "Clever", "Landliebe", "Almased", "Homann Feinkost", "Tchibo", "Sanella", "Öttinger"]
var catchphrase = ["gastronomischer Orgasmus", "Traum", "verführerisches Geschmackserlebnis", "Muntermacher ohne Gleichen.", "Genuss zum Verlieben", "guter Weg den Tag zu beenden.", "der richtig Weg zum Traumkörper"]
var sentences = [
    "Kein anderes Produkt schafft es so sehr die Massen zu begeistern. ",
    "Vom Institut für richtig nice Ernährung empfohlen. ",
    "Mit dem einzigarten Geschmack. ",
    "Der Verkaufschlager aus Italien hat nun auch Deutsche Regale erreicht. ",
    "Nur bei Essentia in der Premium-Aluminiumbox erhältlich. ",
    "Von Doktoren empfohlen: Nur zwei Portionen täglich und die Lebenserwartung steigt um durchschnittlich 18 Sekunden. ",
    "Kalorienarm und ohne natürliches Zucker. Von Natur aus frei von gesättigten Fettsäuren. ",
    "Trägt mit seinem extem hohen Proteingehalt zu einem unnatürlich hohen Muskelzuwachs bei. ",
    "Kann bei zu geringem Verzehr abführend wirken. "
]
var productCategories = [
    {
        name: "Box",
        icons: [1, 2, 3, 4],
        products: ["Kaffee", "Tee", "Spaghetti", "Tortellini", "Müsli"]
    },
    {
        name: "Konserven",
        icons: [5, 6],
        products: ["Mais", "Oliven", "Eingelegte Paprika", "Erbsen", "Bohnen"]
    },
    {
        name: "Marmeladenglas",
        icons: [7],
        products: ["Erdbeermarmelade", "Leberwurst", "Erdnussbutter", "Quark", "Butter"]
    },
    {
        name: "Krug",
        icons: [8],
        products: ["Waschmittel", "Spüli"]
    },
    {
        name: "Schoki",
        icons: [9],
        products: ["Müsli-Riegel", "Schokolade", "Kaugummi"]
    },
    {
        name: "TetraPak",
        icons: [10, 11],
        products: ["Gemüsesaft", "Milch", "Orangensaft", "Tomatensaft", "Soja-Milch"]
    },
    // {
    //     name: "???",
    //     icons: [12],
    //     products: ["", ""]
    // },
    {
        name: "Trinken",
        icons: [13],
        products: ["Wasser", "Eistee", "Bier", "Cola", "Fanta", "Energy Drink"]
    },
    {
        name: "Einmachglas?",
        icons: [14],
        products: ["Gewürzgurken", "Kapern", "Würstchen", "Fertigsauce"]
    }
]
$(function () {
    socket = io();

    function getElem(id) {
        return document.getElementById(id)
    }

    function tpl(id) {
        return doT.template(getElem(id).innerHTML);
    }

    var e = {
        body: document.body,
        details: getElem('details'),
        moving: getElem('moving-product'),
        productImage: getElem('product-image'),
        css: getElem('stylesheet'),
        gridWrapper: getElem('product-grid-wrapper'),
        grid: getElem('product-grid'),
        cart: getElem('cart'),
        priceWrapper: getElem('price-wrapper'),
        totalPrice: getElem('total'),
        buy: getElem('buy-button'),
        summary: getElem('purchase-summary'),
        popup: getElem('popup'),

        tpl: {
            product: tpl('tpl-product'),
            details: tpl('tpl-product-details'),
            actions: tpl('tpl-product-actions'),
            cart: tpl('tpl-cart-product'),
            finalize: tpl('tpl-purchase'),
            demo: tpl('tpl-demo-end'),
            change: tpl('tpl-popup-amount'),
        },

        products: document.getElementsByClassName('product')
    }

    socket.on('tagAppeared', function (tagID) {
        console.log('appear', tagID);
        tag = tagID;

        // if (tagID == '47BF162D55680') {
        document.body.classList.add('tag-active')
        document.body.classList.add('tag-a');
        // }

        getNewProducts();

        // if (tagID == '83A65F0') {
        // }

        if (checkoutReady && tagID == '83A65F0') {
            document.body.classList.add('tag-b');
            var checkmark = getElem('checkmark-svg')
            checkmark.setAttribute('class', 'run-animation')
            window.setTimeout(function () {
                e.summary.innerHTML = e.tpl.demo({})
            }, 1500)
        }
    })

    document.addEventListener('keydown', function (event) {
        console.log(event)
        if (event.code == 'KeyR' || event.code == 'KeyC') {
            getNewProducts()
        }
        if (event.code == 'KeyT' || event.code == 'KeyC') {
            e.body.classList.toggle('tag-active')
        }

        if (event.code == 'Digit1') {
            socket.emit('tagAppeared')
        }

        if (event.code == 'Digit2') {
            socket.emit('tagDisappeared')
        }

        if (event.code == 'Digit3') {
            socket.emit('finishing')
        }
        
    })

    socket.on('tagDisappeared', function (tagID) {
        console.log('disappear', tagID);
        document.body.classList.remove('tag-active')
        document.body.classList.remove('showing-details')
        e.details.innerHTML = ''
    })

    socket.on('finishing', function() {
        document.body.classList.add('tag-b');
        var checkmark = getElem('checkmark-svg')
        checkmark.setAttribute('class', 'run-animation')
        window.setTimeout(function () {
            e.summary.innerHTML = e.tpl.demo({})
        }, 1500)
    })

    socket.on('refresh', function (file) {
        if (file == 'styles.css') {
            e.css.href = e.css.href.replace(/\?t=.*$/, '?t=' + new Date().getMilliseconds())
        } else {
            location.reload()
        }
    })

    function randomNumber(min, max) {
        return Math.floor(Math.random() * max) + min
    }

    function randomElement(arr){
        var r = Math.floor(Math.random() * arr.length)
        return arr[Math.floor(Math.random() * arr.length)]
    }

    function generateProductName(category) {
        var products = productCategories[category ? category - 1 : randomNumber(0, productCategories.length)].products

        var r = {
            product: randomElement(products),
            brand: randomElement(brands)
        }

        console.log(1, r)

        return r
    }

    function generateDescription(brand, productName){
        // Produkt - von - Hersteller - ist ein - Beschreibung
        return productName + " von " + brand + " ist ein " + randomElement(catchphrase) + "."
    }

    function generateMarketing(count){
        var desc = ""
        for(var i = 0; i < count; i++){
            desc += randomElement(sentences)
        }
        return desc
    }

    function getNewProducts() {
        e.grid.innerHTML = ''
        products = []
        for (var i = 0; i <= 15; i++) {
            var node = document.createElement('div')
            node.classList.add('product')
            var cat = randomNumber(1, productCategories.length)
            var own = products[i] = {
                id: i,
                elem: node,
                category: productCategories[cat - 1],
                identity: randomNumber(1, 36),
                price: Math.floor(Math.random() * 500),
                icon: icon,
                name: generateProductName(cat),
            }
            var icon = own.category.icons[randomNumber(0, own.category.icons.length)]
            own.description = generateDescription(own.name.brand, own.name.product) + ' ' + generateMarketing(randomNumber(2, 6))
            own.icon = icon
            node.dataset.productId = i
            node.innerHTML = e.tpl.product({
                // price: formatPrice(metadata.price * cartProd.amount),
                price: formatPrice(own.price),
                category: own.category,
                icon: icon,
                identity: own.identity,
                name: own.name
            })
            node.dataset.icon = icon
            e.grid.appendChild(node)
        }
    }

    function getAbsolutePosition(elem) {
        return elem.getBoundingClientRect();
    }

    function getRelativePosition(elem) {
        var rect = elem.getBoundingClientRect()
        rect.x = elem.offsetLeft
        rect.y = elem.offsetTop
        return rect
    }

    function setPosition(elem, pos) {
        var rect

        if (pos) {
            rect = pos
        } else {
            rect = getAbsolutePosition(elem)
        }

        elem.style.left = rect.x + 'px'
        elem.style.top = rect.y + 'px'
        elem.style.width = rect.width + 'px'
        elem.style.height = rect.height + 'px'
    }

    function morphToFull(elem) {
        morphToSize(elem, {
            x: 0,
            y: 0,
            width: '100%',
            height: '100%'
        })
    }

    function morphToSize(elem, rect) {
        elem.style.left = rect.x
        elem.style.top = rect.y
        elem.style.width = rect.width
        elem.style.height = rect.height
    }

    function triggerReflow(elem) {
        window.getComputedStyle(elem).opacity
        elem.offsetWidth
    }

    function resetElement(elem) {
        var cloneElem = elem.cloneNode(false);
        elem.parentNode.replaceChild(cloneElem, elem);
    }

    function findParentWithClass(elem, elementClass) {
        while ((elem = elem.parentElement) && !elem.classList.contains(elementClass));
        return elem;
    }

    function formatPrice(rawNumber) {
        return Number(rawNumber / 100).toFixed(2)
    }

    function getMetadataForProduct(elem) {
        return products[elem.dataset.productId]
    }

    function getAttention(elem) {
        elem.classList.remove('lookAtMe')
        triggerReflow(elem)
        elem.classList.add('lookAtMe')
    }

    function getHighlighted(elem) {
        elem.classList.remove('highlight')
        triggerReflow(elem)
        elem.classList.add('highlight')
    }

    function changePrice(difference) {
        totalPrice += difference
        getAttention(e.priceWrapper)
        e.totalPrice.innerHTML = formatPrice(totalPrice)
    }

    // for(var elem of e.products) {
    //     setAbsolutePosition(elem)
    //     console.log(elem)
    // }

    var clickedProduct = {
        elem: false,
        rect: false,
        copy: false
    }

    $(document).on('click', '#product-grid .product', function () {
        var pos = getAbsolutePosition(this)
        var copy = this.cloneNode(true)
        copy.classList.add('floating-product')
        e.details.innerHTML = ''
        e.details.appendChild(copy)

        clickedProduct.elem = this
        clickedProduct.rect = pos
        clickedProduct.copy = copy

        var metadata = getMetadataForProduct(this)
        copy.children[1].innerHTML += e.tpl.actions({

        })
        var coal = randomNumber(0, 1000) / 10
        copy.innerHTML += e.tpl.details({
            description: metadata.description,
            inhalt: {
                "brenn": randomNumber(0, 10000) / 10,
                "ei": randomNumber(0, 250) / 10,
                "kohle": coal,
                "zucker": Math.floor(coal - randomNumber(0, coal * 10) / 10),
                "fett": randomNumber(0, 500) / 10,
                "salz": randomNumber(0, 40) / 10
            }
        })
        setPosition(copy, pos)
        triggerReflow(copy)
        requestAnimationFrame(function () {
            e.body.classList.add('showing-details')
            morphToFull(copy)
        })
    })

    $(document).on('click', '.go-back', function () {
        requestAnimationFrame(function () {
            e.body.classList.remove('showing-details')
            morphToSize(clickedProduct.copy, {
                x: clickedProduct.rect.x + 'px',
                y: clickedProduct.rect.y + 'px',
                width: clickedProduct.rect.width + 'px',
                height: clickedProduct.rect.height + 'px'
            })
            window.setTimeout(function () {
                e.details.innerHTML = ''
            }, 600)
        })
    })

    $(document).on('click', '.add-to-cart', function () {
        var parent = findParentWithClass(this, 'product')
        var image = parent.querySelector('.product-image-wrapper')
        var clone = image.cloneNode(true)
        var pos = getAbsolutePosition(image)
        setPosition(clone, pos)
        e.moving.appendChild(clone)
        var metadata = getMetadataForProduct(parent)

        var prod
        var cartProd = cartItems[metadata.id]

        if (cartProd) {
            cartProd.amount++;
            prod = cartProd.elem
            getHighlighted(cartProd.elem)
        } else {
            prod = document.createElement('div')
            prod.classList.add('product')
            e.cart.appendChild(prod)
            cartItems[metadata.id] = cartProd = {
                amount: 1,
                elem: prod
            }
            prod.classList.add('invisible')
            prod.classList.add('instant')
            triggerReflow(prod)
        }

        prod.dataset.productId = metadata.id

        console.log(metadata)

        prod.innerHTML = e.tpl.cart({
            name: metadata.name.product,
            price: formatPrice(metadata.price * cartProd.amount),
            icon: metadata.icon,
            identity: metadata.identity,
            amount: cartProd.amount
        })

        // node.innerHTML = e.tpl.product({
        //     // price: formatPrice(metadata.price * cartProd.amount),
        //     price: formatPrice(own.price),
        //     category: own.category,
        //     icon: icon,
        //     identity: own.identity,
        //     name: own.name
        // })

        // e.cart.scrollTop = e.cart.scrollHeight
        prod.scrollIntoView()
        var newPos = getAbsolutePosition(prod.querySelector('.product-image-wrapper'))
        prod.classList.remove('instant')
        requestAnimationFrame(function () {
            e.body.classList.add('cart-filled')
            clone.classList.add('moving')
            setPosition(clone, newPos)
            window.setTimeout(function () {
                prod.classList.remove('invisible')
            }, 500)
            window.setTimeout(function () {
                // e.moving.innerHTML = ''
                clone.remove()
                changePrice(+metadata.price)
            }, 600)
        })
    })

    $(document).on('click', '#cart .cart-meta', function () {
        var that = this.parentNode
        $('.has-actions').not(that).removeClass('has-actions')
        that.classList.toggle('has-actions')
    })

    
    $(document).on('click', '#cart .cart-actions .done', function () {
        this.parentNode.parentNode.classList.remove('has-actions')
    })

    var amountProduct
    
    $(document).on('click', '#cart .cart-actions .change-amount', function () {
        var product = this.parentNode.parentNode
        var metadata = getMetadataForProduct(product)

        amountProduct = metadata

        console.log(amountProduct)

        e.popup.innerHTML = e.tpl.change({
            name: metadata.name.product,
            amount: cartItems[metadata.id].amount
        })
        e.body.classList.add('popup-visible')
    })

    $(document).on('click', '.plus', function () {
        var i = cartItems[amountProduct.id].amount += 1
        this.parentNode.children[1].innerHTML = i
        // e.body.classList.remove('popup-visible')
    })

    $(document).on('click', '.minus', function () {
        if(cartItems[amountProduct.id].amount > 1) {
            var i = cartItems[amountProduct.id].amount -= 1
            this.parentNode.children[1].innerHTML = i
        }
        // e.body.classList.remove('popup-visible')
    })

    $(document).on('click', '.amount-done', function () {
        e.body.classList.remove('popup-visible')
        var cart = cartItems[amountProduct.id]
        cart.elem.innerHTML = e.tpl.cart({
            name: amountProduct.name.product,
            price: formatPrice(amountProduct.price * cart.amount),
            icon: amountProduct.icon,
            identity: amountProduct.identity,
            amount: cart.amount
        })
    })

    $(document).on('click', '#cart .cart-actions .remove', function () {
        var product = this.parentNode.parentNode
        var metadata = getMetadataForProduct(product)
        changePrice(-metadata.price * cartItems[metadata.id].amount)
        var ref = cartItems[metadata.id].elem
        ref.style.height = ref.clientHeight + 'px'
        triggerReflow(ref)
        ref.classList.add('hide')
        delete cartItems[metadata.id]
        if (!Object.keys(cartItems).length) {
            e.body.classList.remove('cart-filled')
        }
        window.setTimeout(function () {
            ref.remove()
        }, 600)
    })

    e.buy.addEventListener('click', function () {
        e.body.classList.add('finalize-purchase')
        e.summary.innerHTML = e.tpl.finalize({})
        checkoutReady = true
    })

    $(document).on('click', '#cancel-purchase', function () {
        e.body.classList.remove('finalize-purchase')
        $('.has-actions').removeClass('has-actions')
        checkoutReady = false
    })

})