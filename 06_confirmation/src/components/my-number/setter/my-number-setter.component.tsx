import * as React from 'react';

interface Props {
  onRequestNewNumber: () => void;
  onUserConfirmNewNumberRequest: (result : boolean) => void;
}

interface State {
  showingModalConfirmation : boolean;
}

export class MyNumberSetterComponent extends React.PureComponent<Props, State> {
  onConfirmationOptionClicked = (result :boolean) => (e) => {
    this.props.onUserConfirmNewNumberRequest(result);
    this.setState({ showingModalConfirmation: false });
  }

  onRequestNewNumberWithConfirmation = () => {
    this.setState({ showingModalConfirmation: true })
    this.props.onRequestNewNumber();
  }

  state : State = { showingModalConfirmation: false }

  render() {
    const { onRequestNewNumber, onUserConfirmNewNumberRequest } = this.props;

    const setModalDialogStyle = () : React.CSSProperties => ({
      background: '#ADD8E6',
      display: (this.state.showingModalConfirmation) ? 'inline' : 'none'
    });

    return (
      <>
        <button onClick={this.onRequestNewNumberWithConfirmation}>Request new number</button>
        <div style={setModalDialogStyle()}>
          <span>Are you sure you want to get a new number?</span>
          <button onClick={this.onConfirmationOptionClicked(true)}>Yes</button>
          <button onClick={this.onConfirmationOptionClicked(false)}>No</button>
        </div>
      </>
    )
  }
}
