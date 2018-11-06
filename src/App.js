import React, {Component} from 'react';
import Button from '@material/react-button';
import sunset from './images/sunset.jpg';
import logo from './logo.svg';

import './App.scss';
// add the appropriate line(s) in Step 3a if you are using compiled CSS instead.

class App extends Component {
  state = {
    imageUrl: sunset,
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
      </div>
    );
  }

  handleColorSelected(hex) {
    // Note: Not actually hex yet :)
    console.log(hex);
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

  getCanvasCtx() {
    const canvasElement = this.canvasElement.current;
    return canvasElement.getContext('2d');
  }

  updateImage() {
    const canvasElement = this.canvasElement.current;
    const {imageUrl} = this.props;
    const ctx = this.getCanvasCtx();
    const image = new Image();
    image.onload = () => {
      ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      ctx.drawImage(image, 0, 0);
    }
    image.src = imageUrl;
  }

  handleClick(e) {
    const ctx = this.getCanvasCtx();

    const x = e.clientX;
    const y = e.clientY;
    const pixel = ctx.getImageData(x, y, 1, 1).data;

    console.log(pixel);
    this.props.colorSelected(pixel);
  }

  render() {
    return (
      <canvas onClick={(e) => this.handleClick(e)} ref={this.canvasElement} width={1000} height={1000}/>
    );
  }
}

export default App;