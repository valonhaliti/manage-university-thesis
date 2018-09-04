//During the test the env variable is set to test
process.env.NODE_ENV = 'test';
const fs = require('fs');

//Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app');
const expect = chai.expect;
chai.should();
chai.use(chaiHttp);

//Our parent block
describe('Thesis', () => {
    describe('POST /thesis', () => {
        it('it should POST with succes a thesis', (done) => {
            chai.request(app)
                .post('/thesis')
                .attach('thesisPDF', fs.readFileSync('nevada.png'), 'nevada.png')
                .field('title', "Clustering i fjaleve nga rrjete sociale")
                .field('description', "Ne kete punim jane perdorur algoritmete si K-Means etj.")
                .field('category', "Data Science")
                .end((err, res) => {
                    if (err) done(err);
                    expect(res).to.have.status(201);
                    expect(res.body.message).to.equal('Thesis added in database successfully.');
                    done();
                });
        });
    });

    // describe('POST /products/2', () => {
    //     it('should GET product with id 2', (done) => {
    //         chai.request(app)
    //             .get('/products/2')
    //             .end((err, res) => {
    //                 res.should.have.status(200)
    //                 res.body.res.should.be.a('array');
    //                 res.body.res[0].id.should.be.eql(2);
    //                 done();
    //             })
    //     });
    // });

});