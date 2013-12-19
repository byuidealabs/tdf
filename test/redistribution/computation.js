//=============================================================================
//  Module Dependencies
//=============================================================================

var expect = require('chai').expect,
    app = require('../../server'),
    mongoose = require('mongoose'),
    League = mongoose.model('League');

//=============================================================================
//  Globals
//=============================================================================

var agents,
    league,
    altleague,
    returns;

//=============================================================================
//  The Tests
//=============================================================================

describe('<Unit Test>:', function() {
    describe('Model League Statics, Redistribution Computations:', function() {

        //---------------------------------------------------------------------
        //  Static data to be used in all tests
        //---------------------------------------------------------------------

        before(function(done) {
            agents = [
                {
                    '_id': 'idofshortflat',
                    'name': 'shortflat',
                    'portfoliovalue': [
                        {'totalvalue': 100000},
                        {'totalvalue': 100000}
                    ]
                },
                {
                    '_id': 'idofdecreasing',
                    'name': 'decreasing',
                    'portfoliovalue': [
                        {'totalvalue': 100000},
                        {'totalvalue': 99900},
                        {'totalvalue': 99700},
                        {'totalvalue': 99650},
                        {'totalvalue': 99630},
                        {'totalvalue': 99500}
                    ]
                },
                {
                    '_id': 'idofincreasing',
                    'name': 'increasing',
                    'portfoliovalue': [
                        {'totalvalue': 100100},
                        {'totalvalue': 100300},
                        {'totalvalue': 100800},
                        {'totalvalue': 101500},
                        {'totalvalue': 103000},
                        {'totalvalue': 104000},
                        {'totalvalue': 106000},
                        {'totalvalue': 106500}
                    ]
                },
                {
                    '_id': 'idofsporadic',
                    'name': 'sporadic',
                    'portfoliovalue': [
                        {'totalvalue': 101000},
                        {'totalvalue': 100000},
                        {'totalvalue': 99950},
                        {'totalvalue': 99980},
                        {'totalvalue': 99900},
                        {'totalvalue': 100100}
                    ]
                }
            ];
            league = new League({
                'startCash': 100000,
                'redistribute': {
                    'n': 5
                }
            });
            altleague = new League({
                'startCash': 50000,
                'redistribute': {
                    'n': 6
                }
            });

            returns = league.__agents_returns(agents, 5);

            done();
        });

        //---------------------------------------------------------------------
        //  Method __agent_values
        //---------------------------------------------------------------------

        describe('Method __agent_values', function() {

            it('should return an array of 6 $100,000\'s for shortflat',
               function() {
                var values = league.__agent_values(agents[0]);
                expect(values).to.deep.equal([100000, 100000, 100000,
                                              100000, 100000, 100000]);
            });

            it('should pre-pad shortflat with altleague\'s start cash',
               function() {
                var values = altleague.__agent_values(agents[0]);
                expect(values).to.deep.equal([50000, 50000, 50000,
                                              50000, 50000, 100000,
                                              100000]);
            });

            it('should get all of decreasing\'s values', function() {
                var values = league.__agent_values(agents[1]);
                expect(values).to.deep.equal([100000, 99900, 99700,
                                              99650, 99630, 99500]);
            });

            it('should get the last n+1 of increasing\'s values', function() {
                var values = league.__agent_values(agents[2]);
                expect(values).to.deep.equal([100800, 101500, 103000,
                                              104000, 106000, 106500]);
            });

        });

        //---------------------------------------------------------------------
        //  Method __agents_returns
        //---------------------------------------------------------------------

        describe('Method __agents_returns', function() {

            // Testing x

            it('should contain the last 5 values for shortflat', function() {
                var expected = [100000, 100000, 100000, 100000, 100000];
                expect(returns.idofshortflat.x).to.deep.equal(expected);
            });

            it('should contain the last 5 values for decreasing', function() {
                var expected = [99900, 99700, 99650, 99630, 99500];
                expect(returns.idofdecreasing.x).to.deep.equal(expected);
            });

            it('should contain the last 5 values for increasing', function() {
                var expected = [101500, 103000, 104000, 106000, 106500];
                expect(returns.idofincreasing.x).to.deep.equal(expected);
            });

            it('should contain the last 5 values for sporadic', function() {
                var expected = [100000, 99950, 99980, 99900, 100100];
                expect(returns.idofsporadic.x).to.deep.equal(expected);
            });

            // Testing delta

            it('should compute delta for shortflat', function() {
                var expected = [1.0000, 1.0000, 1.0000, 1.0000, 1.0000];
                expect(returns.idofshortflat.delta).to.deep.equal(expected);
            });

            it('should compute delta for decreasing', function() {
                var expected = [0.9990, 0.9980, 0.9995, 0.9998, 0.9987];
                expect(returns.idofdecreasing.delta).to.deep.equal(expected);
            });

            it('should compute delta for increasing', function() {
                var expected = [1.0069, 1.0148, 1.0097, 1.0192, 1.0047];
                expect(returns.idofincreasing.delta).to.deep.equal(expected);
            });

            it('should compute delta for sporadic', function() {
                var expected = [0.9901, 0.9995, 1.0003, 0.9992, 1.0020];
                expect(returns.idofsporadic.delta).to.deep.equal(expected);
            });

            // Testing deltabar

            it('should compute deltabar for shortflat', function() {
                expect(returns.idofshortflat.deltabar).to.equal(1.0000);
            });

            it('should compute deltabar for decreasing', function() {
                expect(returns.idofdecreasing.deltabar).to.equal(0.9990);
            });

            it('should compute deltabar for increasing', function() {
                expect(returns.idofincreasing.deltabar).to.equal(1.0111);
            });

            it('should compute deltabar for sporadic', function() {
                expect(returns.idofsporadic.deltabar).to.equal(0.9982);
            });

        });

    });
});
