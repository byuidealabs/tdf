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
                        {'totalvalue': 999000},
                        {'totalvalue': 997000},
                        {'totalvalue': 996500},
                        {'totalvalue': 996300},
                        {'totalvalue': 995000}
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
                        {'totalvalue': 999500},
                        {'totalvalue': 999800},
                        {'totalvalue': 999000},
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
        //  Static Method __agent_values
        //---------------------------------------------------------------------

        describe('Static Method __agent_values', function() {

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
                expect(values).to.deep.equal([100000, 999000, 997000,
                                              996500, 996300, 995000]);
            });

            it('should get the last n+1 of increasing\'s values', function() {
                var values = league.__agent_values(agents[2]);
                expect(values).to.deep.equal([100800, 101500, 103000,
                                              104000, 106000, 106500]);
            });

        });

    });
});
