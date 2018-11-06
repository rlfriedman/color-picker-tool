import React, {Component} from 'react';
import Button from '@material/react-button';
import sunset from './images/sunset.jpg';
import logo from './logo.svg';

import './App.scss';

class App extends Component {
  state = {
    imageUrl: sunset,
    color: null,
    hex: null,
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
        <ColorPalette hex={this.state.hex} color={this.state.color}></ColorPalette>
      </div>
    );
  }

  handleColorSelected(pixel) {
    const hex = rgbToHex(pixel);
    // Update the color palette.
    this.setState({hex: hex, color: pixel});
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
    this.props.colorSelected(pixel);
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
    if (prevProps.hex !== this.props.hex) {
      this.updateColor();
    }
  }

  updateColor() {
    // Temporarily just update one default color swab.
    const colorSwabEl = this.colorSwabEl.current;
    colorSwabEl.style.backgroundColor = this.props.hex;

    const textColor = this.decideTextColor(this.props.color);
    colorSwabEl.style.color = textColor;
  }

  // Decides what the text color should be based on how dark the background is.
  decideTextColor(backgroundColor) {
    const r = backgroundColor[0];
    const g = backgroundColor[1];
    const b = backgroundColor[2];

    return (r * 0.299 + g * 0.587 + b * 0.114 > 150) ? '#000000' : '#ffffff';
  }

  render() {
    return (
      <div className="color-palette-container">
        <div ref={this.colorSwabEl} className="color-swab">
          {this.props.hex ? this.props.hex : 'Click the image'}
        </div>
      </div>
    );
  }
}

function rgbToHex(imageData) {
  return '#' + ((imageData[0] << 16) | (imageData[1] << 8) | imageData[2]).toString(16);
}

export default App;