import test from 'tape'
import {Schema, Param} from '../src/'

let schema = (params, options) => new Schema(params, options)

test('MenquerySchema add', (t) => {
  let add = (...args) => schema().add('test', ...args).value()
  t.true(schema().add(new Param('test')), 'should add a param with instance')
  t.true(schema().add('test'), 'should add a param')
  t.equal(add('123'), '123', 'should add a param with value')
  t.true(schema().add('test', null, {test: true}).option('test'), 'should add a param with option')
  t.equal(add(null, '123'), '123', 'should add a param with default option string')
  t.equal(add(null, 123), 123, 'should add a param with default option number')
  t.equal(add(null, true), true, 'should add a param with default option boolean')
  t.same(add(null, new Date('2016')), new Date('2016'), 'should add a param with default option date')
  t.same(add(null, /123/i), /123/i, 'should add a param with default option regexp')
  t.equal(add(123, String), '123', 'should add a param with type option string')
  t.equal(add('123', Number), 123, 'should add a param with type option number')
  t.equal(add('123', Boolean), true, 'should add a param with type option boolean')
  t.same(add('2016', Date), new Date('2016'), 'should add a param with type option date')
  t.same(add('123', RegExp), /123/i, 'should add a param with type option regexp')
  t.end()
})

test('MenquerySchema get', (t) => {
  let mySchema = schema()
  mySchema.add('test')
  t.false(schema().get('test'), 'should not get a nonexistent param')
  t.true(mySchema.get('test'), 'should get a param')
  t.end()
})

test('MenquerySchema set', (t) => {
  let mySchema = schema()
  mySchema.add('test')
  t.false(schema().set('test', '123'), 'should not set a nonexistent param')
  t.true(mySchema.set('test', '123'), 'should set a param')
  t.true(mySchema.set('test', '123', {test: true}).option('test'), 'should set param option')
  t.end()
})

test('MenquerySchema option', (t) => {
  let mySchema = schema()
  t.equal(mySchema.option('test', false), false, 'should set option')
  t.equal(mySchema.option('test'), false, 'should get option')
  t.false(mySchema.add('test'), 'should not add disallowed param')
  t.end()
})

test('MenquerySchema param', (t) => {
  let mySchema = schema()
  t.false(mySchema.param('test'), 'should not get a nonexistent param')
  t.true(mySchema.param('test', null), 'should add a param')
  t.true(mySchema.param('test'), 'should get a param')
  t.true(mySchema.param('test', '123'), 'should set a param')
  t.end()
})

test('MenquerySchema formatter', (t) => {
  let mySchema = schema({test: '123'})
  let formatter = mySchema.formatter('scream', (scream, value) => {
    return scream ? value.toUpperCase() : value
  })
  t.true(formatter, 'should create a formatter')
  t.false(schema().formatter('scream'), 'should not get a nonexistent formatter')
  t.true(mySchema.formatter('scream'), 'should get a formatter')
  t.true(mySchema.param('test').formatter('scream'), 'should get param formatter')
  t.equal(mySchema.param('test').value(), '123', 'should not format value')
  t.true(mySchema.param('test').option('scream', true), 'should set param option')
  t.equal(mySchema.param('test').value('help'), 'HELP', 'should format value')
  t.true(mySchema.param('f', null).formatter('scream'), 'should get lazy param formatter')
  t.end()
})

test('MenquerySchema validator', (t) => {
  let mySchema = schema({test: 'help'})
  let validator = mySchema.validator('isPlural', (isPlural, value, param) => ({
    valid: !isPlural || value.toLowerCase().substr(-1) === 's',
    message: param.name + ' must be in plural form.'
  }))
  t.true(validator, 'should create a validator')
  t.false(schema().validator('isPlural'), 'should not get a nonexistent validator')
  t.true(mySchema.validator('isPlural'), 'should get a validator')
  t.true(mySchema.param('test').validator('isPlural'), 'should get param validator')
  t.true(mySchema.validate(), 'should not apply validator')
  t.true(mySchema.param('test').option('isPlural', true), 'should set param option')
  t.false(mySchema.validate(), 'should apply validator and validate false')
  t.true(mySchema.validate({test: 'helps'}), 'should apply validator and validate true')
  t.true(mySchema.param('v', null).validator('isPlural'), 'should get lazy param validator')
  mySchema.validate((err) => t.false(err, 'should call validation success'))
  mySchema.validate({test: 'help'}, (err) => t.false(err.valid, 'should call validation error'))
  t.end()
})

test('MenquerySchema parser', (t) => {
  let mySchema = schema({test: 'help'})
  let parser = mySchema.parser('elemMatch', (elemMatch, value, path) => {
    return elemMatch ? {[path]: {$elemMatch: {[elemMatch]: value}}} : value
  })
  t.true(parser, 'should create a parser')
  t.false(schema().parser('elemMatch'), 'should not get a nonexistent parser')
  t.true(mySchema.parser('elemMatch'), 'should get a parser')
  t.true(mySchema.param('test').parser('elemMatch'), 'should get param parser')
  t.same(mySchema.parse().query, {test: 'help'}, 'should not apply parser')
  t.true(mySchema.param('test').option('elemMatch', 'prop'), 'should set param option')
  t.same(mySchema.parse().query, {test: {$elemMatch: {prop: 'help'}}}, 'should apply parser')
  t.true(mySchema.param('p', null).parser('elemMatch'), 'should get lazy param parser')
  t.end()
})

test('MenquerySchema name', (t) => {
  let mySchema = schema({}, {page: 'p'})
  let name = (type, name) => mySchema[`_get${type}ParamName`](name)
  t.equal(name('Schema', 'p'), 'page', 'should get schema param name by query param name')
  t.equal(name('Schema', 'page'), 'page', 'should get schema param name by itself')
  t.equal(name('Query', 'page'), 'p', 'should get query param name by schema param name')
  t.equal(name('Query', 'p'), 'p', 'should get query param name by itself')
  mySchema = schema({test: String}, {test: 't'})
  t.equal(name('Schema', 't'), 'test', 'should get custom schema param name by query param name')
  t.equal(name('Schema', 'test'), 'test', 'should get custom schema param name by itself')
  t.equal(name('Query', 'test'), 't', 'should get custom query param name by schema param name')
  t.equal(name('Query', 't'), 't', 'should get custom query param name by itself')
  t.end()
})

test('MenquerySchema default parse', (t) => {
  let parse = (...args) => schema().parse(...args)
  t.same(parse({q: 'testing'}).query.keywords, /testing/i, 'should parse q')
  t.same(parse().select, {}, 'should not parse undefined select')
  t.same(parse({select: ''}).select, {}, 'should not parse empty select')
  t.same(parse({select: 'a'}).select, {a: 1}, 'should parse one select')
  t.same(parse({select: '-a,b,+c'}).select, {a: 0, b: 1, c: 1}, 'should parse multiple select')
  t.same(parse({page: 2, limit: 10}).cursor.skip, 10, 'should parse page')
  t.same(parse({limit: 10}).cursor.limit, 10, 'should parse limit')
  t.same(parse({sort: ''}).cursor.sort, {name: 1}, 'should bot parse empty sort')
  t.same(parse({sort: '-a'}).cursor.sort, {a: -1}, 'should parse sort')
  t.same(parse({sort: '-a,b,+c'}).cursor.sort, {a: -1, b: 1, c: 1}, 'should parse multiple sort')
  t.same(schema({distance: 0}).parse({distance: 23}).query.distance, 23, 'should parse any')
  t.end()
})
