import React from "react";
import $ from "jquery";

/* Your OpenWeatherMap (https://openweathermap.org/) API key goes here */
const APIKEY = "";

const forecastCategories = {
	now : {
		value : 0,
		name : "Now"
	},
	hourly : {
		value : 1,
		name : "Hourly"
	},
	twentyFourHours : {
		value : 2,
		name : "24 Hours"
	},
	threeDays : {
		value : 3,
		name : "3 Days"
	},
	sevenDays : {
		value : 4,
		name : "7 Days"
	}
};

export default class App extends React.Component
{
	constructor(props)
	{
		super(props);

		this.state = {
			selectedForecastCategory : forecastCategories.twentyFourHours.value,
			locationQuery : ""
		};

		this.setLocationQuery = this.setLocationQuery.bind(this);
	}

	setLocationQuery(strLocationQuery)
	{
		this.setState({ locationQuery : strLocationQuery });
	}

	render()
	{
		return (
			<main>
				<header>
					<h1>MyOpenWeather</h1>
				</header>

				<SearchSection setLocationQuery={ this.setLocationQuery } />

				<ForecastSection intSelectedCategory={ this.state.selectedForecastCategory } strLocationQuery={ this.state.locationQuery } />
			</main>
		)
	}
}

class SearchSection extends React.Component
{
	static get propTypes()
	{
		return {
			setLocationQuery : React.PropTypes.func.isRequired
		}
	}

	constructor(props)
	{
		super(props);

		this.setLocation = this.setLocation.bind(this);
	}

	setLocation(e)
	{
		if (e.keyCode == 13)
		{
			this.props.setLocationQuery(this.refs.locationSearch.value);
		}
	}

	render()
	{
		return (
			<section>
				<form onSubmit={function(e) { e.preventDefault(); }}>
					<input type="text" ref="locationSearch" onKeyDown={ this.setLocation } />
				</form>
			</section>
		);
	}
}

class ForecastSection extends React.Component
{
	static get propTypes()
	{
		return {
			intSelectedCategory : React.PropTypes.number.isRequired,
			strLocationQuery : React.PropTypes.string.isRequired
		}
	}

	constructor(props)
	{
		super(props);

		this.displayUnavailable = this.displayUnavailable.bind(this);
	}

	displayUnavailable()
	{
		alert("Section is presently unavailable");
	}

	displayForecast()
	{
		let strLocationQuery = this.props.strLocationQuery.trim();
		let strTitle = null;
		let $resultNav = null;
		let $result = null;

		if (strLocationQuery.length > 0)
		{
			$.ajax(
			{
				url: "http://api.openweathermap.org/data/2.5/forecast/?q=" + strLocationQuery + "&APPID=" + APIKEY + "&units=metric",
				type: "get",
				async: false,
				dataType: "json",
				context: this,
				success: function(response) 
				{
					if (response.cod != 404)
					{
						switch (this.props.intSelectedCategory)
						{
							case forecastCategories.twentyFourHours.value:
							{
								let obj24hForecast = [];

								for (let i = 0; i < 8; i++)
								{
									let dtDateTime = response.list[i].dt_txt.split(" ");
									let dtDate = dtDateTime[0].split("-");
									let dtTime = dtDateTime[1].split(":");
									let intHour = new Date(dtDate[0], dtDate[1], dtDate[2], dtTime[0], dtTime[1], dtTime[2]).getHours();

									if (intHour == 0 || intHour == 9 || intHour == 15 || intHour == 18)
									{
										obj24hForecast.push(response.list[i]);

										switch (intHour)
										{
											case 0:
											{
												obj24hForecast[obj24hForecast.length - 1].timeofday = "Night";
												break;
											}
											case 9:
											{
												obj24hForecast[obj24hForecast.length - 1].timeofday = "Morning";
												break;
											}
											case 15:
											{
												obj24hForecast[obj24hForecast.length - 1].timeofday = "Afternoon";
												break;
											}
											case 18:
											{
												obj24hForecast[obj24hForecast.length - 1].timeofday = "Evening";
												break;
											}
										}
									}
								}
								
								strTitle = response.city.name + ", " + response.city.country;

								$resultNav = (
									<nav>
										<ul>
											<li onClick={ this.displayUnavailable }>Now</li>
											<li onClick={ this.displayUnavailable }>Hourly</li>
											<li className="selected">24 Hours</li>
											<li onClick={ this.displayUnavailable }>3 Days</li>
											<li onClick={ this.displayUnavailable }>7 Days</li>
										</ul>
									</nav>
								);
								
								$result = (
									<div>
										{
											obj24hForecast.map(function(item)
											{
												let fltRainAmount = item.rain != undefined ? item.rain["3h"] : 0;
												let fltSnowAmount = item.snow != undefined ? item.snow["3h"] : 0;
												let strPrecipitationType = fltSnowAmount > fltRainAmount ? "Snow" : "Rain";
												let fltPrecipitationAmount = fltSnowAmount > fltRainAmount ? fltSnowAmount : fltRainAmount;
												let strMeasurement = fltSnowAmount > fltRainAmount ? "cm" : "mm";

												return <ForecastItem strWeather={ item.weather[0].main } strPrecipitationType={ strPrecipitationType } strPrecipitationAmount={ (fltPrecipitationAmount < 1 && fltPrecipitationAmount > 0 ? "< 1" : Math.round(fltPrecipitationAmount)) + " " + strMeasurement} fltSpeed={ parseFloat((item.wind.speed * 3.6).toFixed(1)) } intHumidity={ item.main.humidity } strImage={ item.weather[0].icon } strTitle={ item.timeofday } fltTemp={ item.main.temp } />;
											})
										}
									</div>
								);
							}
						}
					}
					else
					{
						strTitle = "Location not found";
					}
				},
				error: function()
				{
					strTitle = "An unexpected error has occurred.  Please try again";
				}
			});
		}

		return (
			<section id="weatherForecast">
				<header>
					<h2>{ strTitle }</h2>
				</header>

				{ $resultNav }
				{ $result }
			</section>
		);
	}

	render()
	{
		return this.displayForecast();
	}
}

class ForecastItem extends React.Component
{
	static get propTypes()
	{
		return {
			strTitle : React.PropTypes.string.isRequired,
			strWeather : React.PropTypes.string.isRequired,
			fltTemp : React.PropTypes.number.isRequired,
			strPrecipitationType : React.PropTypes.string.isRequired,
			strPrecipitationAmount : React.PropTypes.string.isRequired,
			fltSpeed : React.PropTypes.number.isRequired,
			intHumidity : React.PropTypes.number.isRequired,
			strImage : React.PropTypes.string.isRequired
		}
	}

	render()
	{
		return (
				<article>
					<header>
						<h2>{ this.props.strTitle }</h2>
					</header>

					<div>
						<img src={ "images/" + this.props.strImage + ".png" } alt={ this.props.strWeather } title={ this.props.strWeather } />

						<span>{ this.props.strWeather }</span>
					</div>

					<dl>
						<dt>Temp</dt>
						<dd>{ Math.round(this.props.fltTemp) }&deg;C</dd>
					</dl>

					<dl>
						<dt>{ this.props.strPrecipitationType }</dt>
						<dd>{ this.props.strPrecipitationAmount }</dd>
					</dl>

					<dl>
						<dt>Wind</dt>
						<dd>{ this.props.fltSpeed } km/h</dd>
					</dl>

					<dl>
						<dt>Humidity</dt>
						<dd>{ this.props.intHumidity }%</dd>
					</dl>
				</article>
		)
	}
}