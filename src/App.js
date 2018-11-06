import React, {Component} from 'react';
import Button from '@material/react-button';
import sunset from './images/sunset.jpg';
import logo from './logo.svg';

import './App.scss';

class App extends Component {
  state = {
    imageUrl: sunset,
    color: null,
  };

  render() {
    return (
      <div>
        <Button
          raised
          className='button-alternate'
          onClick={() => this.setState({imageUrl: logo})}
        >
          Change Image!
        </Button>
        <ImageCanvas colorSelected={(hex) => this.handleColorSelected(hex)} imageUrl={this.state.imageUrl}></ImageCanvas>
        <ColorPalette color={this.state.color}></ColorPalette>
      </div>
    );
  }

  handleColorSelected(hex) {
    console.log(hex);
    // Update the color palette.
    this.setState({color: hex});
  }
}

class ImageCanvas extends Component {
  canvasElement = React.createRef();
  // constructor(props) {
  //   super(props);
  //   this.state = {
  //     imageUrl: props.imageUrl,
  //   };
  // }

  componentDidMount() {
    this.updateImage();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.imageUrl !== this.props.imageUrl) {
      this.updateImage();
    }
  }

  updateImage() {
    const canvasElement = this.canvasElement.current;
    const {imageUrl} = this.props;
    const ctx = canvasElement.getContext('2d');
    const image = new Image();
    image.onload = () => {
      ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      ctx.drawImage(image, 0, 0);
    }
    image.src = imageUrl;
  }

  handleClick(e) {
    const canvasElement = this.canvasElement.current;
    const ctx = canvasElement.getContext('2d');
    
    const rect = canvasElement.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const pixel = ctx.getImageData(x, y, 1, 1).data;

    console.log(pixel);
    this.props.colorSelected(rgbToHex(pixel));
  }

  render() {
    return (
      <canvas onClick={(e) => this.handleClick(e)} ref={this.canvasElement} width={1000} height={600}/>
    );
  }
}

class ColorPalette extends Component {
  colorSwabEl = React.createRef();

  componentDidUpdate(prevProps) {
    if (prevProps.color !== this.props.color) {
      this.updateColor();
    }
  }

  updateColor() {
    // Temporarily just update one default color swab.
    const colorSwabEl = this.colorSwabEl.current;
    colorSwabEl.style.backgroundColor = this.props.color;
  }

  render() {
    return (
      <div className="color-palette-container">
        <div ref={this.colorSwabEl} className="color-swab"></div>
      </div>
    );
  }
}

function rgbToHex(imageData) {
  return '#' + ((imageData[0] << 16) | (imageData[1] << 8) | imageData[2]).toString(16);
}

export default App;