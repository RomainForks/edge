'use strict'

/*
 * adonis-edge
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const esprima = require('esprima')
const _ = require('lodash')
const debug = require('debug')('edge')
const Expressions = require('../Expressions')
const Statements = require('../Statements')
const CE = require('../Exceptions')

/**
 * Converts an statement to esprima expression.
 */
function _toEsprima (statement) {
  return esprima.parse(statement, {
    range: true
  }).body[0].expression
}

/**
 * Lexer is used to parse a given expression from
 * javascript into tokens and convert it back
 * to a statement.
 *
 * @class Lexer
 */
class Lexer {
  constructor (memoize) {
    /**
     * Making sure not to reparse the same statement
     * again and again when memoize is set to true.
     */
    this._toEsprima = memoize ? _.memoize(_toEsprima) : _toEsprima
    this.parseRaw = memoize ? _.memoize(this._parseRaw) : this._parseRaw
  }
  /**
   * The method to be used for resolving
   * an identifier
   *
   * @attribute resolveFn
   *
   * @return {String}
   */
  get resolveFn () {
    return 'this.resolve'
  }

  /**
   * The method to be used for accessing
   * a child on an object or array
   *
   * @attribute accessFn
   *
   * @return {String}
   */
  get accessFn () {
    return 'this.accessChild'
  }

  /**
   * Method to be used for calling a method
   * inside compiled templates
   *
   * @attribute callFn
   *
   * @return {String}
   */
  get callFn () {
    return 'this.callFn'
  }

  /**
   * Returns the fn to be used for attaching
   * a newFrame to the context stack.
   *
   * @attribute newFrameFn
   *
   * @return {String}
   */
  get newFrameFn () {
    return 'this.newFrame'
  }

  /**
   * Returns the method to be used for adding
   * key/value pair to the most recent
   * frame.
   *
   * @attribute setOnFrameFn
   *
   * @return {String}
   */
  get setOnFrameFn () {
    return 'this.setOnFrame'
  }

  /**
   * Fn to be used for clear the frame and
   * the values inside it.
   *
   * @attribute clearFrameFn
   *
   * @return {String}
   */
  get clearFrameFn () {
    return 'this.clearFrame'
  }

  /**
   * Parse a raw statement to an expression
   * or a statement object.
   *
   * @method parseRaw
   *
   * @param  {String}   statement
   * @param  {Array}    [allowed]
   *
   * @return {Object}
   *
   * @private
   */
  _parseRaw (statement, allowed = []) {
    return this.parse(this._toEsprima(statement), allowed)
  }

  /**
   * Validates the current type against the allowed types.
   * It calls the callback instead of throwing exception
   * when callback is defined. It allowed types are
   * empty, validation gets skipped.
   *
   * @method _validateType
   *
   * @param  {Array}       allowed
   * @param  {String}      current
   * @param  {String}      term
   *
   * @throws {InvalidExpression} If current expression is not from one of the
   *                             allowed expressions.
   *
   * @private
   */
  _validateType (allowed, current, term) {
    if (!_.size(allowed) || _.includes(allowed, current)) {
      return
    }

    throw CE.InvalidExpressionException.notAllowed(allowed, current, term)
  }

  /**
   * Makes sure the type of the parsed expression
   * is a `Literal` or `Identifier`.
   *
   * @method isStatement
   *
   * @param  {String}    type
   *
   * @return {Boolean}
   */
  isStatement (type) {
    return type === 'Identifier' || type === 'Literal'
  }

  /**
   * Tells if something is an expression and also
   * an expression supported by edge.
   *
   * ## For example
   * Async is a valid expression but not supported
   * by edge.
   *
   * @method isExpression
   *
   * @param  {String}   expressionType
   *
   * @return {Boolean}
   */
  isExpression (expressionType) {
    return !!Expressions[expressionType]
  }

  /**
   * Parses an `Identifier` or a `Literal` to a consumable
   * instance.
   *
   * @method parseStatement
   *
   * @param  {Object}         expression
   * @param  {Array}          [allowed]
   *
   * @return {Object}
   *
   * @throws {Error} If invalid statement type
   */
  parseStatement (expression, allowed = []) {
    debug('parsing %s statement', expression.type)
    this._validateType(allowed, expression.type, 'statement')

    if (Statements[expression.type]) {
      return Statements[expression.type](expression)
    }

    throw new Error(`Cannot parse ${expression.type} statement`)
  }

  /**
   * Parses an expression into internal expression
   * instance.
   *
   * @method parseExpression
   *
   * @param  {Object}          expression
   * @param  {Array}           [allowed]
   *
   * @return {Object}
   *
   * @throws {Error} If invalid or unsupported expression type
   */
  parseExpression (expression, allowed = []) {
    debug('parsing %s', expression.type)
    this._validateType(allowed, expression.type, 'expression')

    if (Expressions[expression.type]) {
      const expressionInstance = new Expressions[expression.type](this)
      expressionInstance.parse(expression)
      return expressionInstance
    }

    throw new Error(`Cannot parse ${expression.type} expression`)
  }

  /**
   * Parses an esprima expression to an internal
   * expression. This method will detect the
   * type and makes the right conversion.
   *
   * @method parse
   *
   * @param  {Object}   expression
   * @param  {Array}    [allowed]
   *
   * @return {Object}
   */
  parse (expression, allowed = []) {
    debug('attempting to parse %s', expression.type)
    try {
      if (this.isStatement(expression.type)) {
        return this.parseStatement(expression, allowed)
      }
      return this.parseExpression(expression, allowed)
    } catch (error) {
      throw CE.RuntimeException.cannotParse(error)
    }
  }
}

module.exports = Lexer
