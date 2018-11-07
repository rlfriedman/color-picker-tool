import React, {Component} from 'react';
import Button from '@material/react-button';
import sunset from './images/sunset.jpg';
import logo from './logo.svg';
import withRipple from '@material/react-ripple';

import './App.scss';

class App extends Component {
  state = {
    imageUrl: sunset,
    color: null,
    hex: null,
    tempHex: null,
    currentSwab: 0,
    totalSwabs: 1,
    maxSwabs: 5,
    isActive: true,
  };

  render() {
    return (
      <div className="app-container">
{/*         <Button
          raised
          className='button-alternate'
          onClick={() => this.setState({imageUrl: logo})}
        >
          Change Image!
        </Button> */}
        <div className="color-tool-container">
          <ImageCanvas colorMove={(pixel) => this.handleColorMove(pixel)}
                      colorSelected={(hex) => this.handleColorSelected(hex)} 
                      imageUrl={this.state.imageUrl}>
          </ImageCanvas>
          <ColorPalette currentSwab={this.state.currentSwab}
                        tempHex={this.state.tempHex} 
                        hex={this.state.hex} 
                        color={this.state.color} 
                        maxSwabs={this.state.maxSwabs}
                        handleSwabClick={(swabIndex) => this.handleSwabClick(swabIndex)}>
          </ColorPalette>
        </div>
      </div>
    );
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
      return;
    }

    this.setState({hex: hex, 
                  color: pixel, 
                  currentSwab: activeSwab,
                  totalSwabs: activeSwab + 1 > this.state.totalSwabs ? activeSwab + 1 : this.state.totalSwabs});
  }

  handleSwabClick(index) {
    this.setState({currentSwab: index, isActive: true});
  }

  handleSwabAdded() {
    this.setState({totalSwabs: this.state.totalSwabs + 1});
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
              width={800} height={400}/>
    );
  }
}

class ColorPalette extends Component {
  colorSwabEl = React.createRef();

  constructor(props) {
    super(props);
    this.state = {
      colorSwabs: ["#F5F5F5"],
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.hex !== this.props.hex) {
      this.updateColor();
    }
    if (prevProps.tempHex !== this.props.tempHex) {
      this.updateColor(true);
    }
  }

  updateColor(temp) {
    const swabs = this.state.colorSwabs.slice();
    swabs[this.props.currentSwab] = temp ? this.props.tempHex : this.props.hex;
    this.setState({colorSwabs: swabs});
  }

  renderSwab() {
    const swabs = this.state.colorSwabs.slice();
    swabs.push(<RippleColorSwab hex={this.props.hex} key={this.state.colorSwabs.length} />);
    this.setState({colorSwabs: swabs});
  }

  render() {
    const swabs = [];
    for (let i = 0; i < this.state.colorSwabs.length; i++) {
      swabs.push(<RippleColorSwab hex={this.state.colorSwabs[i]} key={i} id={i} handleSwabClick={(swabIndex) => this.props.handleSwabClick(swabIndex)} />);
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

  constructor(props) {
    super(props);
    this.state = {
      hasSetColor: false,
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.hex !== this.props.hex) {
      this.updateColor();
    }
  }

  componentDidMount() {
    console.log(this.colorSwabEl.current);
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
      // You must call `initRipple` from the root element's ref. This attaches the ripple
      // to the element.
      initRipple,
      // include `unbounded` to remove warnings when passing `otherProps` to the
      // root element.
      unbounded,
      handleSwabClick,
      ...otherProps
    } = this.props;

    const classes = `color-swab ${className}`;

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
  return '#' + ((imageData[0] << 16) | (imageData[1] << 8) | imageData[2]).toString(16);
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