const axios = require('axios');
async function createChatCompletion(input){

  const options = {
    method: 'POST',
    url: 'https://openai80.p.rapidapi.com/chat/completions',
    headers: {
      'Accept-Encoding': 'identity',
      'content-type': 'application/json',
      'X-RapidAPI-Key': '1c42c8ba71msh344f7cca2442de5p1e45f4jsn3c81eef9702d',
      'X-RapidAPI-Host': 'openai80.p.rapidapi.com'
    },
    data: {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: input
        }
      ]
    }
  };
  try {
    const response = await axios.request(options);
    return response.data.choices[0].message
  } catch (error) {
    return(error);
  }
}
exports.createChatCompletion = createChatCompletion
