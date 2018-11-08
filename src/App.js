import React, {Component} from 'react';
import Button from '@material/react-button';
import sunset from './images/sunset.jpg';
import flowers from './images/flowers.jpg';
import parrots from './images/parrots.jpg';
import island from './images/island.jpg';
import logo from './logo.svg';
import withRipple from '@material/react-ripple';
import TextField, {HelperText, Input} from '@material/react-text-field';

import './App.scss';
import { debug } from 'util';
import { encode } from 'punycode';

const images = [sunset, flowers, parrots, island];

class App extends Component {
  state = {
    imageUrl: images[0],
    colorSwabs: ['empty'],
    currentImageIndex: 0,
    color: null,
    hex: null,
    tempHex: null,
    currentSwab: 0,
    totalSwabs: 1,
    maxSwabs: 5,
    isActive: true,
    textFieldValue: '',
  };

  render() {
    return (
      <div className="app-container">
        <div className="color-tool-container">
          <ImageCanvas colorMove={(pixel) => this.handleColorMove(pixel)}
                      colorSelected={(hex) => this.handleColorSelected(hex)} 
                      imageUrl={this.state.imageUrl}>
          </ImageCanvas>
          <ColorPalette colorSwabs={this.state.colorSwabs}
                        currentSwab={this.state.currentSwab}
                        tempHex={this.state.tempHex} 
                        hex={this.state.hex} 
                        color={this.state.color} 
                        maxSwabs={this.state.maxSwabs}
                        handleSwabClick={(swabIndex) => this.handleSwabClick(swabIndex)}>
          </ColorPalette>
          <div className="control-container">
            <Button
              outlined
              className='random-image-button'
              onClick={() => {
                this.setState({
                  imageUrl: images[(this.state.currentImageIndex + 1) % images.length],
                  currentImageIndex: this.state.currentImageIndex + 1,
                });
                this.resetPallete();
              }}>
              Random Image
            </Button>
            <TextField
              outlined
              label='Update Image URL'
            >
            <Input
              value={this.state.textFieldValue}
              onKeyPress={(e) => this.handleInputKeypress(e)}
              onChange={(e) => this.setState({textFieldValue: e.target.value})}/>
            </TextField>
          </div>
        </div>
      </div>
    );
  }

  componentDidUpdate(prevProps, prevState) {
    // This should not be called always but for now need to to leave the
    // url after the palette is reset.
    if (prevState.imageUrl !== this.state.imageUrl) {
      this.updateImageUrlParam();
    }
  }

  componentWillMount() {
    const url = new URL(window.location.href);
   //debugger;
    let imageUrl = url.searchParams.get('url');
    if (imageUrl) {
      imageUrl = decodeURIComponent(imageUrl);
      this.setState({imageUrl: imageUrl});
    }

    const palleteParams = ['p0', 'p1', 'p2', 'p3', 'p4'];
    const paletteColors = [];

    for (let i = 0; i < palleteParams.length; i++) {
      const param = palleteParams[i];
      let color = url.searchParams.get(param);
      if (color) {
        color = '#' + color;
        paletteColors.push(color);
      }
    }
    if (paletteColors.length) {
      this.setState({colorSwabs: paletteColors,
        totalSwabs: paletteColors.length,
        currentSwab: this.state.maxSwabs > paletteColors.length ? paletteColors.length : this.state.maxSwabs - 1,
        isActive: this.state.maxSwabs !== paletteColors.length,
        
      })
    }
  }

  updateImageUrlParam() {
    const url = new URL(window.location.href);
    url.searchParams.set('url', encodeURIComponent(this.state.imageUrl));
    window.history.replaceState({path:url.toString()},'', url.toString());
    const encodedUrl = encodeURIComponent(this.state.imageUrl);
  }

  addColorToUrl(hex) {
    const url = new URL(window.location.href);
    url.searchParams.set('p' + this.state.currentSwab.toString(), hex.substring(1));
    window.history.replaceState({path:url.toString()},'', url.toString());
  }

  handleInputKeypress(e) {
    if (e.key === 'Enter') {
      this.setState({
        imageUrl: this.state.textFieldValue,
        textFieldValue: '',
      });
      this.resetPallete();
    }
  }

  resetPallete() {
    window.history.replaceState(null, null, window.location.pathname);
    this.setState({
      totalSwabs: 1,
      currentSwab: 0,
      isActive: true,
      colorSwabs: ["empty"],
    });
    this.updateImageUrlParam();
  }

  handleColorMove(pixel) {
    if (!this.state.isActive) {
      return;
    }
    const hex = rgbToHex(pixel);
    this.setState({tempHex: hex, color: null});  
  }

  handleColorSelected(pixel) {
    if (!this.state.isActive) {
      return;
    }
    const hex = rgbToHex(pixel);
    // Consider what to do here. This will cause a new swab to be added
    // if resetting a different swab's color. Potentially should
    // remove 'unset' swabs when clicking on another to change it.
    const activeSwab = this.state.totalSwabs;

    // Only increment the active swab to add a new one if not at the max number.
    if (this.state.totalSwabs === this.state.maxSwabs) {
      this.setState({isActive: false});
      this.addColorToUrl(hex);
      return;
    }
    this.addColorToUrl(hex);
    const newSwabs = this.state.colorSwabs.slice();
    // Add a new swab.
    newSwabs.push('empty');

    this.setState({hex: 'empty', 
                  color: pixel, 
                  currentSwab: activeSwab,
                  totalSwabs: activeSwab + 1 > this.state.totalSwabs ? activeSwab + 1 : this.state.totalSwabs,
                  colorSwabs: newSwabs});
  }

  handleSwabClick(index) {
    this.setState({currentSwab: index, isActive: true});
  }
}

class ImageCanvas extends Component {
  canvasElement = React.createRef();

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

      const {
        offsetX,
        offsetY,
        width,
        height,
      } = resizeImageToFitCanvas(image, canvasElement);

      ctx.drawImage(image, offsetX, offsetY, width, height);
    }
    image.crossOrigin = "Anonymous";
    image.src = imageUrl;
  }


  handleClick(e) {
    const pixel = this.getColorFromMouseEvent(e);
    this.props.colorSelected(pixel);
  }

  handleMouseMove(e) {
    const pixel = this.getColorFromMouseEvent(e);
    this.props.colorMove(pixel);
  }

  getColorFromMouseEvent(e) {
    const canvasElement = this.canvasElement.current;
    const ctx = canvasElement.getContext('2d');
    
    const rect = canvasElement.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    return ctx.getImageData(x, y, 1, 1).data;
  }

  render() {
    return (
      <canvas onMouseMove={(e) => this.handleMouseMove(e)}
              onClick={(e) => this.handleClick(e)} 
              ref={this.canvasElement} 
              width={1000} height={600}/>
    );
  }
}

class ColorPalette extends Component {
  colorSwabEl = React.createRef();

  componentDidUpdate(prevProps) {
    if (prevProps.hex !== this.props.hex) {
      this.updateColor();
    }
    if (prevProps.tempHex !== this.props.tempHex) {
      this.updateColor(true);
    }
  }

  updateColor(temp) {
    this.props.colorSwabs[this.props.currentSwab] = temp ? this.props.tempHex : this.props.hex;
  }

  render() {
    const swabs = [];
    for (let i = 0; i < this.props.colorSwabs.length; i++) {
      let hex = '';
      let empty = false;
      if (this.props.colorSwabs[i] === 'empty') {
        hex = '#FFFFFF';
        empty = true;
      } else {
        hex = this.props.colorSwabs[i];
      }
      swabs.push(<RippleColorSwab hex={hex} empty={empty} key={i} id={i} handleSwabClick={(swabIndex) => this.props.handleSwabClick(swabIndex)} />);
    }
    return (
      <div className="color-palette-container">
        {swabs}
      </div>
    );
  }
}

class ColorSwab extends Component {
  colorSwabEl = React.createRef();

  componentDidUpdate(prevProps) {
   // if (prevProps.hex !== this.props.hex) {
      this.updateColor();
   // }
   // if (!prevProps.hex && this.props.hex) {
     // this.updateColor();
   // }
  }

  componentDidMount() {
    this.props.initRipple(this.colorSwabEl.current);
  }

  updateColor() {
    const colorSwabEl = this.colorSwabEl.current;
    colorSwabEl.style.backgroundColor = this.props.hex;

    //const textColor = this.decideTextColor(this.props.color);
    //colorSwabEl.style.color = textColor;
  }

  // Decides what the text color should be based on how dark the background is.
  decideTextColor(backgroundColor) {
    const r = backgroundColor[0];
    const g = backgroundColor[1];
    const b = backgroundColor[2];

    return (r * 0.299 + g * 0.587 + b * 0.114 > 150) ? '#000000' : '#ffffff';
  }

  render() {
    const {
      className = '',
      initRipple,
      unbounded,
      handleSwabClick,
      empty,
      ...otherProps
    } = this.props;

    const classes = `color-swab ${this.props.empty ? 'no-color' : ''} ${className}`;

    return (
      <div ref={this.colorSwabEl} className={classes}
           onClick={() => this.props.handleSwabClick(this.props.id)}
           {...otherProps}>
        <span className="color-swab-text">
          {/* {this.state.hasSetColor ? this.props.hex : ''}
          {this.props.hex ? '' : 'Select'} */}
        </span>
      </div>
    );
  }
}

const RippleColorSwab = withRipple(ColorSwab);

function rgbToHex(imageData) {
  const rgb = ((imageData[0] << 16) | (imageData[1] << 8) | imageData[2]);
  return '#' + (0x1000000 + rgb).toString(16).slice(1);
}

function resizeImageToFitCanvas(image, canvas) {
  const parentWidth = canvas.width;
  const parentHeight = canvas.height;
  const childWidth = image.width;
  const childHeight = image.height;
  const offsetX = 0.5;
  const offsetY = 0.5;

  const childRatio = childWidth / childHeight
  const parentRatio = parentWidth / parentHeight
  let width = parentWidth;
  let height = parentHeight;

  if (childRatio < parentRatio) {
    height = width / childRatio;
  } else {
    width = height * childRatio;
  }
  return {
    width,
    height,
    offsetX: (parentWidth - width) * offsetX,
    offsetY: (parentHeight - height) * offsetY
  }
}

export default App;