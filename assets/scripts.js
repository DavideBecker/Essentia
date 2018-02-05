var tag
var cartItems = {}
var products = {}
var totalPrice = 0
var checkoutReady = false
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

        tpl: {
            product: tpl('tpl-product'),
            details: tpl('tpl-product-details'),
            actions: tpl('tpl-product-actions'),
            cart: tpl('tpl-cart-product'),
            finalize: tpl('tpl-purchase'),
            demo: tpl('tpl-demo-end'),
        },

        products: document.getElementsByClassName('product')
    }

    socket.on('tagAppeared', function (tagID) {
        console.log('appear', tagID);
        tag = tagID;

        if (tagID == '47BF162D55680') {
            document.body.classList.add('tag-active')
            document.body.classList.add('tag-a');
        }

        // if (tagID == '83A65F0') {
        // }
        
        if(checkoutReady && tagID == '83A65F0') {
            document.body.classList.add('tag-b');
            var checkmark = getElem('checkmark-svg')
            checkmark.setAttribute('class', 'run-animation')
            window.setTimeout(function() {
                e.summary.innerHTML = e.tpl.demo({})
            }, 1500)
        }
    })

    socket.on('tagDisappeared', function (tagID) {
        console.log('disappear', tagID);
        document.body.classList.remove('tag-active')
        document.body.classList.remove('showing-details')
        e.details.innerHTML = ''
    })

    socket.on('refresh', function (file) {
        if (file == 'styles.css') {
            e.css.href = e.css.href.replace(/\?t=.*$/, '?t=' + new Date().getMilliseconds())
        } else {
            location.reload()
        }
    })

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
        copy.innerHTML += e.tpl.details({
            description: metadata.description
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

        prod.innerHTML = e.tpl.cart({
            name: metadata.name,
            price: formatPrice(metadata.price * cartProd.amount),
            amount: cartProd.amount
        })

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

    $(document).on('click', '#cart .cart-actions .remove', function () {
        var product = this.parentNode.parentNode
        var metadata = getMetadataForProduct(product)
        changePrice(-metadata.price * cartItems[metadata.id].amount)
        var ref = cartItems[metadata.id].elem
        ref.style.height = ref.clientHeight + 'px'
        triggerReflow(ref)
        ref.classList.add('hide')
        delete cartItems[metadata.id]
        if(!Object.keys(cartItems).length) {
            e.body.classList.remove('cart-filled')
        }
        window.setTimeout(function() {
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

    for (var i = 0; i <= 15; i++) {
        var node = document.createElement('div')
        node.classList.add('product')
        var own = products[i] = {
            id: i,
            elem: node,
            price: Math.floor(Math.random() * 2000),
            name: 'Lorem Ipsum',
            description: 'Eine kurze Beschreibung. Et consequatur voluptas delectus perspiciatis saepe. Beatae placeat iure veniam consequatur reprehenderit. Eveniet repellat ducimus nam aut veniam a.'
        }
        node.dataset.productId = i
        node.innerHTML = e.tpl.product({
            price: formatPrice(own.price),
            name: own.name
        })
        e.grid.appendChild(node)
    }
})