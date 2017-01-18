/**
 * @license
 * Copyright 2017 The Lovefield Project Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
goog.setTestOnly();
goog.require('goog.Promise');
goog.require('lf.schema');
goog.require('lf.schema.DataStoreType');

function testObserverWithObjectRow() {
  var builder = lf.schema.create('test', 1);
  var db;
  var foo;
  var resolver = goog.Promise.withResolver();
  var hitCount = 1;
  var observer = function(change) {
    console.log(hitCount, change);
    hitCount++;
    var expected = {
      id: '1111',
      data: {a: 1, b: 2},
      name: 'post ' + hitCount
    };
    assertObjectEquals(expected, change[0].object[0]);
    if (hitCount > 2) {
      resolver.resolve();
    }
  };

  builder.createTable('foo')
      .addColumn('id', lf.Type.STRING)
      .addColumn('data', lf.Type.OBJECT)
      .addColumn('name', lf.Type.STRING)
      .addPrimaryKey(['id']);
  builder.connect({storeType: lf.schema.DataStoreType.MEMORY})
      .then(function(dbInstance) {
        db = dbInstance;
        foo = db.getSchema().table('foo');
        var row = foo.createRow({
          id: '1111',
          data: {a: 1, b: 2},
          name: 'post 1'
        });
        return db.insert().into(foo).values([row]).exec();
      }).then(function() {
        console.log('u1');
        var query = db.select().from(foo).where(foo['id'].eq('1111'));
        db.observe(query, observer);
        return db.update(foo)
            .set(foo['name'], 'post 2')
            .where(foo['id'].eq('1111')).exec();
      }).then(function() {
        console.log('u2');
        return db.update(foo)
            .set(foo['name'], 'post 3')
            .where(foo['id'].eq('1111')).exec();
      }, resolver.reject);
  return resolver.promise;
}
