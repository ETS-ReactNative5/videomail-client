var h            = require('hyperscript'),
    util         = require('util'),

    Events         = require('./../events'),
    EventEmitter   = require('./../util/eventEmitter'),
    VideomailError = require('./../util/videomailError')

var Form = function(container, formElement, options) {

    EventEmitter.call(this, options, 'Form')

    var self = this,
        keyInput

    function getData() {
        var limit = formElement.elements.length,
            data  = {}

        for (var i = 0; i < limit; i++) {
            if (formElement.elements[i].name)
                data[formElement.elements[i].name] = formElement.elements[i].value
        }

        return data
    }

    function isNotButton(element) {
        return element.tagName !== 'BUTTON' && element.type !== 'submit'
    }

    function setDisabled(disabled, buttonsToo) {
        var limit = formElement.elements.length

        for (var i = 0; i < limit; i++) {
            if (buttonsToo || (!buttonsToo && isNotButton(formElement.elements[i])))
                formElement.elements[i].disabled = disabled
        }
    }

    function hideAllInputs() {
        var limit = formElement.elements.length

        for (var i = 0; i < limit; i++) {
            formElement.elements[i].classList.add('hide')
        }
    }

    this.disable = function(buttonsToo) {
        setDisabled(true, buttonsToo)
    }

    this.enable = function(buttonsToo) {
        setDisabled(false, buttonsToo)
    }

    this.build = function() {
        if (options.enableAutoValidation) {
            var textElements = formElement.querySelectorAll('input, textarea')

            for (var i = 0, len = textElements.length; i < len; i++) {
                textElements[i].addEventListener('input', function() {
                    container.validate()
                })
            }

            var selectElements = formElement.querySelectorAll('select')

            for (var i = 0, len = selectElements.length; i < len; i++) {
                selectElements[i].addEventListener('change', function() {
                    container.validate()
                })
            }
        }

        keyInput = formElement.querySelector('input[name="' + options.selectors.keyInputName + '"]')

        if (!keyInput) {
            keyInput = h('input', {
                name: options.selectors.keyInputName,
                type: 'hidden'
            })

            formElement.appendChild(keyInput)
        }

        this.on(Events.PREVIEW, function(videomailKey) {
            // beware that preview doesn't always come with a key, i.E.
            // container.show() can emit PREVIEW without a key when a replay already exists
            // (can happen when showing - hiding - showing videomail over again)

            // only emit error if key is missing AND the input has no key (value) yet
            if (!videomailKey && !keyInput.value)
                self.emit(Events.ERROR, VideomailError.create(
                    'Videomail key for preview is missing!'
                ))
            else if (videomailKey)
                keyInput.value = videomailKey
            // else
            // leave as it and use existing keyInput.value
        })

        this.on(Events.ERROR, function(err) {
            // since https://github.com/binarykitchen/videomail-client/issues/60
            // we hide areas to make it easier for the user
            if (err.isBrowserProblem && err.isBrowserProblem())
                hideAllInputs()
        })

        formElement.addEventListener('submit', function(e) {

            // when videomail-client is hidden, leave the form handling as it and
            // do not mess with it at all
            if (!container.areVisualsHidden()) {
                e.preventDefault()

                // only adjust submission when there is a container, otherwise
                // do nothing and leave as it for robustness
                if (container.hasElement()) {
                    container.submitAll(
                        getData(),
                        formElement.getAttribute('method'),
                        formElement.getAttribute('action')
                    )
                }
            }
        })
    }

    this.validate = function() {
        return formElement.checkValidity()
    }

    this.getSubmitButton = function() {
        return formElement.querySelector("[type='submit']")
    }
}

util.inherits(Form, EventEmitter)

module.exports = Form
