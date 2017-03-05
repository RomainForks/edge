'use strict'

/*
 * adonis-edge
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

class BaseExpression {
  constructor (lexer) {
    this._lexer = lexer
  }

  /**
   * Returns type of the expression.
   *
   * @return {String}
   */
  get type () {
    return this._tokens.type
  }

  /**
   * Returns original type of the
   * expression.
   *
   * @return {String}
   */
  get originalType () {
    return this.constructor.name
  }

  /**
   * Returns tokens object. Make sure to
   * call parse before accessing tokens.
   *
   * @return {Object}
   */
  get tokens () {
    return this._tokens
  }

  /**
   * Converts the expression into a statement by calling
   * toStatement method on the expression.
   *
   * @method _convertToStatement
   *
   * @param  {Object}      expression
   * @param  {Boolean}     wrapSource
   *
   * @return {String}
   *
   * @private
   */
  _convertToStatement (expression, wrapSource) {
    if (expression.type !== 'source') {
      return expression.toStatement()
    }
    return expression.toStatement(!wrapSource)
  }

  /**
   * Parses an expression. This method does not validates
   * itself and it is responsbility of the consumer
   * to pass right expression
   *
   * @return {void}
   */
  parse () {
    throw new Error(`Cannot parse ${this.constructor.name}. Contact package author`)
  }
}

module.exports = BaseExpression
