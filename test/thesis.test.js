import fs from 'fs';
import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../app';
import db from '../dbconnection';

process.env.NODE_ENV = 'test'; // During the test the env variable is set to test

const expect = chai.expect;
chai.should();
chai.use(chaiHttp);
const requester = chai.request(app).keepOpen();


// Our parent block
describe('Thesis', function() {
    before(function(done) {
        db
            .query('DELETE FROM thesis WHERE id > 0;')
            .then(() => done())
            .catch(err => done(err));
    });

    const auth = {};
    before(loginUser(auth));

    describe('POST /thesis', function() {

        it('should require authorization', function(done) {
            requester
                .post('/thesis')
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res).to.have.status(401);
                    done();
                });
        });

        it('should POST with succes a thesis', function(done) {
            requester
                .post('/thesis')
                .set('Authorization', `Bearer ${auth.token}`)
                .field('title', "Clustering i fjaleve nga rrjete sociale")
                .field('description', "Ne kete punim jane perdorur algoritmete si K-Means etj.")
                .field('category', "Data Science")
                .attach('thesisPDF', fs.readFileSync('nevada.png'), 'nevada.png')
                .end((err, res) => {
                    if (err) done(err);
                    expect(res).to.have.status(201);
                    expect(res.body.message).to.equal('Thesis added in database successfully.');
                    done();
                });
        });
    });    
});

function loginUser(auth) {
    return function(done) {
        requester
            .post('/users/login')
            .send({
                email: 'valonfhaliti@gmail.com',
                password: 'valoni123'
            })
            .end(onResponse);
        function onResponse(err, res) {
            if (err) done(err);
            expect(res).to.have.status(200);
            auth.token = res.body.token;
            return done();
        }
    }
}
