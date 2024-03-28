import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv/config';

import hmacSHA256 from 'crypto-js/hmac-sha256.js';
import Hex from 'crypto-js/enc-hex.js'

const app = express();
const port = 3000;

app.get('/:string', async (req, res) => {
    // { image_ID: String, the ID of the image 
    //     thumbnails: String, thumbnails url of the image 
    //     preview: String, preview url of the image 
    //     title: String, preview url from the image 
    //     source: String, which image library you get this image from? [Unsplash, Storyblocks, Pixabay] 
    //     tags: Array, the tag/keywords of the images (if any) }    
    
    // // storyblocks
    const PRIVATE_KEY = process.env.PRIVATE_KEY
    const PUBLIC_KEY = process.env.PUBLIC_KEY
    const expires = Math.floor(Date.now() / 1000)+60*60*24
    const resource = "/api/v2/images/search"
    const key=PRIVATE_KEY+expires
    const hashDigest = hmacSHA256(resource, key).toString(Hex);

    const unsplash = axios.get(`https://api.unsplash.com/search/photos/?client_id=${process.env.UNSPLASH}&query=${req.params.string}`)
    .then((response) => {
        return new Promise((resolve) => {               
            resolve(response.data.results.map((result) => {
                return {image_ID: result.id, 
                    thumbnails: result.urls.thumb, 
                    preview: result.urls.small, 
                    title: result.alt_description, 
                    source: "Unsplash", 
                    tags: result.tags.map(tag => tag.title)}
            }))
        })		
	}).catch(err => console.log('unsplash error:', err.message))
    const pixabay = axios.get(`https://pixabay.com/api/?key=${process.env.PIXABAY}&q=${req.params.string}`)
    .then((response) => {
        return new Promise((resolve) => {                           
            resolve(response.data.hits.map((result) => {
                return {image_ID: result.id, 
                    thumbnails: result.previewURL, 
                    preview: result.imageURL, 
                    title: null, 
                    source: "Pixabay", 
                    tags: [result.tags]}
            }))
        })		
	}).catch(err => console.log('pixabay error:', err.message))
    const storyblocks = axios.get(`https://api.graphicstock.com/api/v2/images/search?project_id=1&user_id=1&
    keywords=${req.params.string}&APIKEY=${PUBLIC_KEY}&EXPIRES=${expires}&HMAC=${hashDigest}`)
    .then((response) => {
        return new Promise((resolve) => {
            resolve(response.data.results.map((result) => { 
                return {image_ID: result.id, 
                    thumbnails: result.thumbnail_url, 
                    preview: result.preview_url, 
                    title: result.title, 
                    source: "Storyblocks", 
                    tags: null}
            }))
        })		
	}).catch(err => console.log('storyblocks error:', err.message))
    
    Promise.all([unsplash, pixabay, storyblocks]).then((combinedResults) => {
        var finalResults = []
        combinedResults.map((results) => {
            results?.map((result) => {
                finalResults.push(result)
            })
        })
        res.json(finalResults);
    });    

});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});