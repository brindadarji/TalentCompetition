import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Cookies from 'js-cookie';
import LoggedInBanner from '../../Layout/Banner/LoggedInBanner.jsx';
import { LoggedInNavigation } from '../../Layout/LoggedInNavigation.jsx';
import { JobSummaryCard } from './JobSummaryCard.jsx';
import { BodyWrapper, loaderData } from '../../Layout/BodyWrapper.jsx';
import { Pagination, Icon, Dropdown, Checkbox, Accordion, Form, Segment, Card, Button, ButtonGroup } from 'semantic-ui-react';

export default class ManageJob extends React.Component {
    constructor(props) {
        super(props);
        let loader = loaderData
        loader.allowedUsers.push("Employer");
        loader.allowedUsers.push("Recruiter");

        this.state = {

            loadJobs: [],
            loaderData: loader,
            activePage: 1,
            itemsPerPage: 2,
            sortbyDate: 'desc',
            filter: {
                showActive: true,
                showClosed: false,
                showDraft: true,
                showExpired: true,
                showUnexpired: true
            },
            loading: false,
            totalPages: 1,
            activeIndex: "",

        }
       this.loadData = this.loadData.bind(this);
       this.init = this.init.bind(this);
       this.loadNewData = this.loadNewData.bind(this);
       this.handleSortChange = this.handleSortChange.bind(this);
       this.handlePaginationChange = this.handlePaginationChange.bind(this);
       this.closeJob = this.closeJob.bind(this);
        this.renderNoJobsFound = this.renderNoJobsFound.bind(this);
        //your functions go here
    };

    init() {
        let loaderData = TalentUtil.deepCopy(this.state.loaderData);
        loaderData.isLoading = false;
        this.setState({ loaderData }, () => {
            this.loadData(); // Load data after setting loaderData
        });

        //this.setState({ loaderData });//comment this

        ////set loaderData.isLoading to false after getting data
        this.loadData(() =>
            this.setState({ loaderData })
        )  
    }

    componentDidMount() {
        this.init(); 
    };

    loadData(callback) {
        this.setState({ loading: true });
        const { activePage, sortbyDate, filter } = this.state;
        const { showActive, showClosed, showDraft, showExpired, showUnexpired } = filter;
        const params = {
            activePage,
            sortbyDate,
            showActive,
            showClosed,
            showDraft,
            showExpired,
            showUnexpired
        };
        const queryString = Object.keys(params)
            .map(key => key + '=' + params[key])
            .join('&');

        const cookies = Cookies.get('talentAuthToken');

        try {
            const link = 'https://talentservicestalent20240213205904.azurewebsites.net/listing/listing/getSortedEmployerJobs?' + queryString;
            fetch(link, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + cookies
                }
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then((data) => {
                    console.log('Job Fetched Successfully:', data);
                    const { myJobs } = data;
                    this.setState({
                        loadJobs: myJobs,
                        loading: false
                    });
                })
                .catch((error) => {
                    console.error('Error fetching job data:', error);
                    this.setState({
                        loading: false,
                    });
                });
        }
        catch (error) {
            console.log("Error fetching data", error);
        }
    }

    handleSortChange(event) {
        this.setState({ activePage: 1 });
        const sortbyDate = event.target.value;
        this.setState({ sortbyDate }, () => {
            this.loadData(); // Reload data after sorting order change
        });
    }

    handlePaginationChange(e, { activePage }) {
        this.setState({ activePage });
    }

    closeJob(jobId) {
        if (!jobId) {
            console.error('Invalid job ID:', jobId);
            return;
        }

        const cookies = Cookies.get('talentAuthToken');
        try {
            const link = 'https://talentservicestalent20240213205904.azurewebsites.net/listing/listing/closeJob';

            fetch(link, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + cookies
                },
                body: JSON.stringify(jobId),
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Response from server:', data);
                    if (data.success) {
                        this.setState(prevState => ({
                            loadJobs: prevState.loadJobs.filter((job) => job.id !== jobId)
                        }));
                        console.log("Job closed successfully");
                    } else {
                        console.error('Error closing job:', data.message);
                    }
                })
                .catch(error => {
                    console.error('Error closing job:', error);
                });
        }
        catch (error) {
            console.log("Error in close job request", error)
        }
    }

    
    handleEditClick(id) {
        this.props.history.push(`/EditJob/${id}`);
    }

    loadNewData(data) {
        let loader = this.state.loaderData;
        loader.isloading = true;
        data[loaderData] = loader;
        this.setstate(data, () => {
            this.loadData(() => {
                loader.isloading = false;
                this.setstate({
                    loadData: loader
                })
            })
        });
    }

    calculateVisibleJobs() {
        const { loadJobs, activePage, itemsPerPage } = this.state;
        const startIndex = (activePage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return loadJobs.slice(startIndex, endIndex);
    }

    renderNoJobsFound() {
        const { loading } = this.state;
        const visibleJobs = this.calculateVisibleJobs();

        if (!loading && (!visibleJobs || visibleJobs.length === 0)) {
            return <div className='div-nojobs'>No jobs found.</div>;
        }
        return null;
    }

    renderJobCard() {
        const { loading, currrentDate } = this.state;
        const currentDate = new Date();
        const visibleJobs = this.calculateVisibleJobs();
      
        return visibleJobs.length > 0 && (
                    <div className="ui centered cards">
                        {visibleJobs.map(job => (
                            <div className="ui card" key={job.id}>
                                <div className="content">

                                    <div className="header">{job.title}</div>
                                    <a className="ui black right ribbon label"><i aria-hidden="true" className="user icon"></i><b>{job.noOfSuggestions}</b></a>
                                    <div className="meta">{job.location.city}, {job.location.country}</div>
                                    <div className="description descriptiondiv">{job.summary}</div>
                                    <div className='lastdivcard'>
                                        <div className='ui red label'>
                                            {currentDate > job.expiryDate ? (
                                                <label>Expired</label>
                                            ) : (
                                                <label>Unexpired</label>
                                            )}
                                        </div>
                                        <div className="buttongrp ui mini buttons">
                                            <Button color='blue' className="ui blue basic button" onClick={() => this.closeJob(job.id)}><Icon name='ban'></Icon>Close</Button>
                                            <Button color='blue' className="ui blue basic button" onClick={() => this.handleEditClick(job.id)}><Icon name='edit outline'></Icon>Edit</Button>
                                            <Button color='blue' className="ui blue basic button"><Icon name='copy outline'></Icon>Copy</Button>

                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
    }

    render() {
        const { loadJobs, loading, filter, activePage, itemsPerPage, selectedStatus } = this.state;
        const totalPages = Math.ceil(loadJobs.length / itemsPerPage);
        
        return (
            <BodyWrapper reload={this.init} loaderData={this.state.loaderData}>

            <div>
                <div className="cards_container">
                    <h1>List of Jobs</h1>
                        <div style={{ float: 'left' }}><Icon name='filter'></Icon>Filter:
                            <select>
                                <option>Choose Filter</option>
                            </select>
                           
                        </div>
                    <div style={{ float: 'right' }}><Icon name='calendar alternate outline'></Icon>Sort by date:
                            <select value={this.state.sortbyDate} onChange={this.handleSortChange}>
                                <option value="desc">Newest First</option>
                                <option value="asc">Oldest First</option>  
                            </select>
                    </div>
                </div>

                    {this.renderNoJobsFound()}

                    {this.renderJobCard()}
               
                <div className='div-pagination'>
                    <Pagination
                        activePage={activePage}
                        totalPages={totalPages}
                        onPageChange={this.handlePaginationChange} 
                    />
                </div>
            </div>
            </BodyWrapper>
        )
    }
}