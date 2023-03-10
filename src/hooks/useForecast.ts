import axios from "axios";
import { useState } from "react";
import { weatherApi, pokeApi } from "../lib/api";
import { getRandomNumber } from "../utils/formatter";

export interface ForecastTypes {
  main: {
    temp: number;
    temp_min: number;
    temp_max: number;
  };
  weather: {
    id: number;
    main: string;
    description: string;
    icon: string;
  }[];
}

export interface Pokemon  {
  name: string;
  image: string;
  stats: {
    base_stat: number,
    stat: {
      name: string;
    }
  }[];
  type?: {
    type: {
      name: string;
    }
  }[];
}

interface PokemonUrl extends Omit<Pokemon, 'image' | 'stats' | 'type'>{
  url: string;
}

export function useForecast() {
  const [isError, setError] = useState<false | string>(false);
  const [isLoading, setLoading] = useState(false);
  const [forecast, setForecast] = useState<false | ForecastTypes>(false);
  const [pokemon, setPokemon] = useState<false | Pokemon>(false);
  const [typeOfPokemon, setTypeOfPokemon] = useState('');

  async function getForecastData(city: string) {
    try {
      const { data } = await weatherApi.get(`/weather`, {
        params: {
          q: city,
          units: 'metric',
          lang: 'pt_br',
          appid: import.meta.env.VITE_WEATHERAPI_KEY,
        },
      });
      
      if(!data) throw 'error';

      const forecastData: ForecastTypes = {
        main: data.main,
        weather: data.weather
      }
      return forecastData;

    } catch (error) {
      console.clear();
      setError('Cidade não encontrada')
      setLoading(false);
      return
    }
  }

  async function getTypeOfPokemonByTemperature(temperature: number, isRain: string) {
    if(isRain.toLocaleLowerCase().includes('chuva')) return 'electric'
    if(temperature < 5)  return 'ice';
    if(temperature >= 5 && temperature < 10)  return 'water';
    if(temperature >= 12 && temperature < 15)  return 'grass';
    if(temperature >= 15 && temperature < 21)  return 'ground';
    if(temperature >= 23 && temperature < 27)  return 'bug';
    if(temperature >= 27 && temperature <= 33)  return 'rock';
    if(temperature > 33)  return 'fire';
    console.log('chuvendo:',isRain)
    return 'normal'
  }

  async function getPokemons(type: string) {
    try {
      const { data } = await pokeApi.get(`/type/${type}`);
      return data.pokemon;
    } catch (error) {
      console.log(error);
      setError('Cidade não encontrada. Tente novamente!')
      setLoading(false);
    }
  }

  async function getPokemonInfo(pokemon: PokemonUrl) {
    const { data } = await axios.get(pokemon.url);
    
    const pokemonInfo = {
      name: data.name,
      image: data.sprites.other['official-artwork'].front_default,
      stats: data.stats,
      type: data.types
    }

    return pokemonInfo;
  }
  
  async function submitRequest(city: string) {
    try {
      setLoading(true);
      setError(false);
      setForecast(false);
      setPokemon(false);

      const response = await getForecastData(city);
      if(!response) return;

      const temperature = Math.round(response.main.temp);
      const isRain = response.weather[0].description;
      const typeOfPokemon = await getTypeOfPokemonByTemperature(temperature, isRain);
      const pokemons = await getPokemons(typeOfPokemon);
      const pokemonInfo = await getPokemonInfo(pokemons[getRandomNumber(0,pokemons.length)].pokemon);
      
      setTypeOfPokemon(typeOfPokemon);
      setPokemon(pokemonInfo);
      setForecast(response);
    } catch (error) {
      console.log(error)
      setError('Algo deu errado. Sry. Tente novamente!')
    } finally {
      setLoading(false);
    }
  }

  return { isError, isLoading, forecast, submitRequest, pokemon, typeOfPokemon };
}
